import base64
import json
import re
from decimal import Decimal, InvalidOperation

from django.db import transaction

from ..gemini import GeminiError, generate_content
from ..models import AIConfiguration, CashOutSession


CONTACTS = [
    {"id": "karim-store", "name": "করিম স্টোর", "number": "01712345678", "label": "এজেন্ট"},
    {"id": "rahim", "name": "রহিম উদ্দিন", "number": "01819876543", "label": "সাম্প্রতিক"},
    {"id": "maa", "name": "মা", "number": "01911223344", "label": "পছন্দের"},
]

BN_DIGITS = str.maketrans("০১২৩৪৫৬৭৮৯", "0123456789")
TO_BN_DIGITS = str.maketrans("0123456789", "০১২৩৪৫৬৭৮৯")
WORD_AMOUNTS = {
    "একশ": 100,
    "দুইশ": 200,
    "তিনশ": 300,
    "চারশ": 400,
    "পাঁচশ": 500,
    "ছয়শ": 600,
    "সাতশ": 700,
    "আটশ": 800,
    "নয়শ": 900,
    "এক হাজার": 1000,
    "দুই হাজার": 2000,
    "পাঁচ হাজার": 5000,
}


def _clean_json(value):
    value = value.strip()
    if value.startswith("```"):
        value = re.sub(r"^```(?:json)?\s*|\s*```$", "", value)
    return json.loads(value)


def _fallback_interpret(text):
    lowered = text.lower().translate(BN_DIGITS)
    amount = next((value for words, value in WORD_AMOUNTS.items() if words in text), None)
    numbers = re.findall(r"\d+(?:\.\d+)?", lowered)
    phone = next((number for number in numbers if len(number) >= 10), "")
    if amount is None:
        amount = next((float(number) for number in numbers if number != phone), None)
    if re.search(r"\b(yes|ok|okay|confirm)\b|হ্যাঁ|ঠিক আছে|নিশ্চিত", lowered):
        decision = "confirm"
    elif re.search(r"\b(no|change|wrong)\b|না|বদল|ভুল", lowered):
        decision = "change"
    elif re.search(r"\b(cancel|stop)\b|বাতিল|বন্ধ", lowered):
        decision = "cancel"
    else:
        decision = "unknown"
    return {
        "transcript": text,
        "intent": "cash_out" if re.search(r"cash\s*out|ক্যাশ\s*আউট|টাকা তুল", lowered) else "other",
        "decision": decision,
        "phone": phone,
        "amount": amount,
        "recipientName": "",
    }


def interpret_turn(*, state, text="", audio_bytes=None, mime_type=""):
    config = AIConfiguration.current()
    if audio_bytes and (not config.is_enabled or not config.api_key):
        raise GeminiError("Voice understanding needs a configured Gemini API key.")
    if not config.is_enabled or not config.api_key:
        return _fallback_interpret(text)

    prompt = f"""
You are an intent parser for a safe Bangla wallet cash-out flow.
Current state: {state}.
Extract what the user said. Never approve or execute a transaction.
Return only JSON with these keys:
transcript (string), intent (cash_out or other), decision (confirm, change, cancel, or unknown),
phone (digits only or empty), amount (positive number or null), recipientName (string or empty).
Understand Bangla and English, including spoken Bangla number words.
""".strip()
    parts = [{"text": prompt}]
    if audio_bytes:
        parts.append({"inlineData": {"mimeType": mime_type, "data": base64.b64encode(audio_bytes).decode("ascii")}})
        parts.append({"text": "Transcribe and interpret this audio."})
    else:
        parts.append({"text": f"User message: {text}"})
    response = generate_content(
        api_key=config.api_key,
        model_name=config.model_name,
        contents=[{"role": "user", "parts": parts}],
        generation_config={"responseMimeType": "application/json", "temperature": 0},
    )
    try:
        parsed = _clean_json(response)
    except (json.JSONDecodeError, TypeError) as error:
        if text:
            return _fallback_interpret(text)
        raise GeminiError("Gemini could not understand the audio safely. Please try again.") from error
    parsed.setdefault("transcript", text)
    parsed.setdefault("intent", "other")
    parsed.setdefault("decision", "unknown")
    parsed.setdefault("phone", "")
    parsed.setdefault("amount", None)
    parsed.setdefault("recipientName", "")
    return parsed


def _money(value):
    if value is None:
        return None
    try:
        amount = Decimal(str(value)).quantize(Decimal("0.01"))
    except (InvalidOperation, ValueError):
        return None
    return amount if Decimal("1") <= amount <= Decimal("50000") else None


def _masked(number):
    return f"{number[:3]}••••{number[-4:]}" if len(number) >= 7 else number


def session_payload(session, error=""):
    prompts = {
        "WELCOME": "আসসালামু আলাইকুম। আমি কীভাবে আপনাকে সাহায্য করতে পারি?",
        "CONFIRM_INTENT": "আপনি ক্যাশ আউট করতে চান। এই সেবাটি কি ঠিক আছে?",
        "ASK_RECIPIENT": "আপনি কোন এজেন্ট নম্বর থেকে ক্যাশ আউট করবেন? নম্বর বলুন, লিখুন অথবা তালিকা থেকে বেছে নিন।",
        "CONFIRM_RECIPIENT": f"{session.recipient_name or 'এজেন্ট'}, নম্বর {_masked(session.recipient_number)}। নম্বরটি কি ঠিক আছে?",
        "ASK_AMOUNT": "কত টাকা ক্যাশ আউট করতে চান?",
        "CONFIRM_AMOUNT": f"আপনি {session.amount:,.0f} টাকা ক্যাশ আউট করবেন। পরিমাণটি কি ঠিক আছে?" if session.amount else "পরিমাণটি কি ঠিক আছে?",
        "REVIEW": "সব তথ্য মিলিয়ে দেখুন। ঠিক থাকলে পরবর্তী ধাপে যাওয়ার অনুমতি দিন।",
        "COMPLETE": "ডেমো অনুরোধ প্রস্তুত হয়েছে। কোনো টাকা পাঠানো হয়নি। আসল লেনদেনে এখন পিন লাগবে।",
        "CANCELLED": "ক্যাশ আউট প্রক্রিয়াটি বাতিল করা হয়েছে।",
    }
    step_index = {
        "WELCOME": 0, "CONFIRM_INTENT": 0, "ASK_RECIPIENT": 1, "CONFIRM_RECIPIENT": 1,
        "ASK_AMOUNT": 2, "CONFIRM_AMOUNT": 2, "REVIEW": 3, "COMPLETE": 3, "CANCELLED": 0,
    }[session.state]
    controls = {"allowText": True, "allowVoice": True, "actions": [], "contacts": [], "amounts": []}
    if session.state == "WELCOME":
        controls["actions"] = [{"id": "start_cash_out", "label": "ক্যাশ আউট", "primary": True}]
    elif session.state in {"CONFIRM_INTENT", "CONFIRM_RECIPIENT", "CONFIRM_AMOUNT"}:
        controls["actions"] = [
            {"id": "change", "label": "পরিবর্তন করুন", "primary": False},
            {"id": "confirm", "label": "ঠিক আছে", "primary": True},
        ]
    elif session.state == "ASK_RECIPIENT":
        controls["contacts"] = CONTACTS
    elif session.state == "ASK_AMOUNT":
        controls["amounts"] = [500, 1000, 2000]
    elif session.state == "REVIEW":
        controls["actions"] = [
            {"id": "change", "label": "পরিমাণ বদলান", "primary": False},
            {"id": "confirm", "label": "নিশ্চিত, পরবর্তী ধাপ", "primary": True},
        ]
    elif session.state in {"COMPLETE", "CANCELLED"}:
        controls = {"allowText": False, "allowVoice": False, "actions": [{"id": "restart", "label": "আবার শুরু করুন", "primary": True}], "contacts": [], "amounts": []}

    fee = session.fee
    return {
        "sessionId": session.id,
        "state": session.state,
        "stepIndex": step_index,
        "prompt": prompts[session.state],
        "transcript": session.last_transcript,
        "error": error,
        "controls": controls,
        "draft": {
            "service": "ক্যাশ আউট",
            "recipientName": session.recipient_name,
            "recipientNumber": _masked(session.recipient_number) if session.recipient_number else "",
            "amount": float(session.amount) if session.amount is not None else None,
            "fee": float(fee) if fee is not None else None,
            "total": float(session.amount + fee) if session.amount is not None and fee is not None else None,
        },
    }


def speech_prompt(session):
    """Return TTS-friendly Bangla without symbols that may be read aloud."""
    if session.state == "CONFIRM_RECIPIENT" and session.recipient_number:
        last_four = " ".join(session.recipient_number[-4:].translate(TO_BN_DIGITS))
        return f"{session.recipient_name or 'এজেন্ট'}। নম্বরের শেষ চার সংখ্যা {last_four}। নম্বরটি কি ঠিক আছে।"
    prompt = session_payload(session)["prompt"]
    return prompt.replace("?", "।").replace("？", "।").replace("•", "")


@transaction.atomic
def advance_session(*, session, action="", text="", audio_bytes=None, mime_type="", contact_id="", amount=None):
    session = CashOutSession.objects.select_for_update().get(pk=session.pk, user=session.user)
    if action == "restart":
        session = CashOutSession.objects.create(user=session.user)
        return session_payload(session)
    if action == "cancel":
        session.state = "CANCELLED"
        session.save()
        return session_payload(session)

    interpreted = None
    if text or audio_bytes:
        interpreted = interpret_turn(state=session.state, text=text, audio_bytes=audio_bytes, mime_type=mime_type)
        session.last_transcript = interpreted.get("transcript", text)[:1000]
        if interpreted.get("decision") == "cancel":
            session.state = "CANCELLED"
            session.save()
            return session_payload(session)

    if session.state == "WELCOME":
        if action == "start_cash_out" or (interpreted and interpreted.get("intent") == "cash_out"):
            session.state = "CONFIRM_INTENT"
        else:
            session.save()
            return session_payload(session, "এখন শুধু ‘ক্যাশ আউট’ বলে বা লিখে চেষ্টা করুন।")
    elif session.state == "CONFIRM_INTENT":
        decision = action or (interpreted or {}).get("decision")
        if decision == "confirm":
            session.state = "ASK_RECIPIENT"
        elif decision == "change":
            session.state = "WELCOME"
        else:
            session.save()
            return session_payload(session, "হ্যাঁ অথবা না বলে নিশ্চিত করুন।")
    elif session.state == "ASK_RECIPIENT":
        contact = next((item for item in CONTACTS if item["id"] == contact_id), None)
        phone = (contact or {}).get("number") or str((interpreted or {}).get("phone", "")).translate(BN_DIGITS)
        phone = re.sub(r"\D", "", phone)
        if len(phone) not in {10, 11}:
            session.save()
            return session_payload(session, "সঠিক ১০ বা ১১ সংখ্যার মোবাইল নম্বর দিন।")
        session.recipient_number = phone
        session.recipient_name = (contact or {}).get("name") or (interpreted or {}).get("recipientName") or "নতুন এজেন্ট"
        session.state = "CONFIRM_RECIPIENT"
    elif session.state == "CONFIRM_RECIPIENT":
        decision = action or (interpreted or {}).get("decision")
        if decision == "confirm":
            session.state = "ASK_AMOUNT"
        elif decision == "change":
            session.recipient_name = ""
            session.recipient_number = ""
            session.state = "ASK_RECIPIENT"
        else:
            session.save()
            return session_payload(session, "নম্বরটি ঠিক হলে নিশ্চিত করুন, নাহলে পরিবর্তন করুন।")
    elif session.state == "ASK_AMOUNT":
        parsed_amount = _money(amount if amount is not None else (interpreted or {}).get("amount"))
        if parsed_amount is None:
            session.save()
            return session_payload(session, "১ থেকে ৫০,০০০ টাকার মধ্যে একটি পরিমাণ দিন।")
        session.amount = parsed_amount
        session.state = "CONFIRM_AMOUNT"
    elif session.state == "CONFIRM_AMOUNT":
        decision = action or (interpreted or {}).get("decision")
        if decision == "confirm":
            session.state = "REVIEW"
        elif decision == "change":
            session.amount = None
            session.state = "ASK_AMOUNT"
        else:
            session.save()
            return session_payload(session, "পরিমাণটি ঠিক হলে নিশ্চিত করুন, নাহলে পরিবর্তন করুন।")
    elif session.state == "REVIEW":
        decision = action or (interpreted or {}).get("decision")
        if decision == "confirm":
            session.state = "COMPLETE"
        elif decision == "change":
            session.amount = None
            session.state = "ASK_AMOUNT"
        else:
            session.save()
            return session_payload(session, "সব তথ্য দেখে নিশ্চিত করুন অথবা পরিবর্তন করুন।")

    session.save()
    return session_payload(session)
