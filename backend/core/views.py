import json

from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .auth import api_auth, get_request_user
from .gemini import GeminiError, generate_content
from .gemini_tts import synthesize_bangla
from .models import AIConfiguration, ApiToken, CashOutSession, ChatMessage, Conversation, KnowledgeDocument


def body_json(request):
    try:
        return json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return None


def user_payload(user):
    return {
        "id": user.id,
        "username": user.username,
        "name": user.get_full_name() or user.username,
        "role": "admin" if user.is_staff else "user",
    }


def auth_response(user):
    token = ApiToken.issue_for(user)
    return JsonResponse({"token": token.key, "user": user_payload(user)})


@csrf_exempt
@require_http_methods(["POST"])
def login(request):
    data = body_json(request)
    if data is None:
        return JsonResponse({"error": "Invalid JSON."}, status=400)
    user = authenticate(username=data.get("username", ""), password=data.get("password", ""))
    if not user:
        return JsonResponse({"error": "Username or password is incorrect."}, status=401)
    return auth_response(user)


@csrf_exempt
@require_http_methods(["POST"])
def quick_login(request):
    if not settings.DEBUG:
        return JsonResponse({"error": "Quick login is disabled outside development."}, status=403)
    data = body_json(request) or {}
    role = data.get("role")
    if role not in {"user", "admin"}:
        return JsonResponse({"error": "Role must be user or admin."}, status=400)
    username = "demo_admin" if role == "admin" else "demo_user"
    User = get_user_model()
    user, created = User.objects.get_or_create(
        username=username,
        defaults={
            "first_name": "Demo Admin" if role == "admin" else "Raihan Ahmed",
            "is_staff": role == "admin",
            "is_superuser": role == "admin",
        },
    )
    if created:
        user.set_password("admin123" if role == "admin" else "user123")
        user.save()
    return auth_response(user)


@csrf_exempt
@require_http_methods(["POST"])
def logout(request):
    user = get_request_user(request)
    if user:
        ApiToken.objects.filter(user=user).delete()
    return JsonResponse({"ok": True})


@require_http_methods(["GET"])
@api_auth()
def me(request):
    config = AIConfiguration.current()
    return JsonResponse({
        "user": user_payload(request.api_user),
        "aiEnabled": config.is_enabled,
        "aiConfigured": bool(config.api_key)
    })


def config_payload(config):
    masked = ""
    if config.api_key:
        masked = f"••••••••{config.api_key[-4:]}"
    masked_cartesia = ""
    if config.cartesia_api_key:
        masked_cartesia = f"••••••••{config.cartesia_api_key[-4:]}"
    return {
        "provider": config.provider,
        "ttsProvider": config.tts_provider,
        "modelName": config.model_name,
        "ttsModelName": config.tts_model_name,
        "ttsVoiceName": config.tts_voice_name,
        "ttsEnabled": config.tts_enabled,
        "apiKeyMasked": masked,
        "hasApiKey": bool(config.api_key),
        "cartesiaApiKeyMasked": masked_cartesia,
        "hasCartesiaApiKey": bool(config.cartesia_api_key),
        "systemPrompt": config.system_prompt,
        "isEnabled": config.is_enabled,
        "updatedAt": config.updated_at.isoformat(),
    }


@require_http_methods(["GET"])
def public_config(request):
    config = AIConfiguration.current()
    return JsonResponse({
        "aiEnabled": config.is_enabled,
        "aiConfigured": bool(config.api_key)
    })

@csrf_exempt
@require_http_methods(["GET", "PUT"])
@api_auth(admin_only=True)
def ai_settings(request):
    config = AIConfiguration.current()
    if request.method == "GET":
        return JsonResponse({"settings": config_payload(config)})
    data = body_json(request)
    if data is None:
        return JsonResponse({"error": "Invalid JSON."}, status=400)
    if data.get("provider", "gemini") != "gemini":
        return JsonResponse({"error": "Only Gemini is supported for now."}, status=400)
    model_name = str(data.get("modelName", "")).strip()
    if not model_name:
        return JsonResponse({"error": "Model name is required."}, status=400)
    config.provider = "gemini"
    config.model_name = model_name
    config.tts_provider = str(data.get("ttsProvider", config.tts_provider)).strip() or config.tts_provider
    config.tts_model_name = str(data.get("ttsModelName", config.tts_model_name)).strip() or config.tts_model_name
    config.tts_voice_name = str(data.get("ttsVoiceName", config.tts_voice_name)).strip() or config.tts_voice_name
    config.tts_enabled = bool(data.get("ttsEnabled", True))
    if str(data.get("apiKey", "")).strip():
        config.api_key = str(data["apiKey"]).strip()
    if str(data.get("cartesiaApiKey", "")).strip():
        config.cartesia_api_key = str(data["cartesiaApiKey"]).strip()
    config.system_prompt = str(data.get("systemPrompt", config.system_prompt)).strip()
    config.is_enabled = bool(data.get("isEnabled", True))
    config.updated_by = request.api_user
    config.save()
    return JsonResponse({"settings": config_payload(config), "message": "AI settings saved."})


@csrf_exempt
@require_http_methods(["POST"])
@api_auth(admin_only=True)
def test_ai_connection(request):
    data = body_json(request) or {}
    config = AIConfiguration.current()
    api_key = str(data.get("apiKey", "")).strip() or config.api_key
    model_name = str(data.get("modelName", "")).strip() or config.model_name
    try:
        reply = generate_content(
            api_key=api_key,
            model_name=model_name,
            contents=[{"role": "user", "parts": [{"text": "Reply with exactly: Connection successful"}]}],
            timeout=15,
        )
    except GeminiError as error:
        return JsonResponse({"ok": False, "error": str(error)}, status=400)
    return JsonResponse({"ok": True, "message": "Connection successful.", "response": reply})


@csrf_exempt
@require_http_methods(["GET", "POST"])
@api_auth(admin_only=True)
def knowledge_documents(request):
    if request.method == "GET":
        docs = KnowledgeDocument.objects.all().order_by("-uploaded_at")
        data = [{"id": d.id, "title": d.title, "content": d.content, "uploaded_at": d.uploaded_at.isoformat()} for d in docs]
        return JsonResponse({"documents": data})
    
    if request.method == "POST":
        data = body_json(request) or {}
        title = data.get("title", "").strip()
        content = data.get("content", "").strip()
        if not title or not content:
            return JsonResponse({"error": "Title and content are required."}, status=400)
        doc = KnowledgeDocument.objects.create(title=title, content=content)
        return JsonResponse({"id": doc.id, "title": doc.title, "content": doc.content, "uploaded_at": doc.uploaded_at.isoformat()})

@csrf_exempt
@require_http_methods(["DELETE"])
@api_auth(admin_only=True)
def knowledge_document_detail(request, doc_id):
    try:
        doc = KnowledgeDocument.objects.get(id=doc_id)
        doc.delete()
        return JsonResponse({"ok": True})
    except KnowledgeDocument.DoesNotExist:
        return JsonResponse({"error": "Document not found."}, status=404)


@csrf_exempt
@require_http_methods(["POST"])
@api_auth(admin_only=True)
def test_tts_connection(request):
    data = body_json(request) or {}
    config = AIConfiguration.current()
    try:
        tts_provider = str(data.get("ttsProvider", "")).strip() or config.tts_provider
        if tts_provider == "cartesia":
            from .cartesia_tts import synthesize_cartesia
            audio, content_type = synthesize_cartesia(
                api_key=str(data.get("cartesiaApiKey", "")).strip() or config.cartesia_api_key,
                model_id=str(data.get("ttsModelName", "")).strip() or config.tts_model_name,
                voice_id=str(data.get("ttsVoiceName", "")).strip() or config.tts_voice_name,
                text="আসসালামু আলাইকুম। বাংলা ভয়েস সংযোগ সফল হয়েছে।",
                timeout=20,
            )
        else:
            audio, content_type = synthesize_bangla(
                api_key=str(data.get("apiKey", "")).strip() or config.api_key,
                model_name=str(data.get("ttsModelName", "")).strip() or config.tts_model_name,
                voice_name=str(data.get("ttsVoiceName", "")).strip() or config.tts_voice_name,
                text="আসসালামু আলাইকুম। বাংলা ভয়েস সংযোগ সফল হয়েছে।",
                timeout=20,
            )
    except Exception as error:
        return JsonResponse({"error": str(error)}, status=400)
    return HttpResponse(audio, content_type=content_type)

@csrf_exempt
@require_http_methods(["POST"])
@api_auth()
def general_tts(request):
    data = body_json(request) or {}
    text = str(data.get("text", "")).strip()
    if not text:
        return JsonResponse({"error": "Text is required."}, status=400)
        
    config = AIConfiguration.current()
    if not config.tts_enabled:
        return JsonResponse({"error": "TTS is disabled."}, status=409)
        
    try:
        if config.tts_provider == "cartesia":
            from .cartesia_tts import synthesize_cartesia
            audio, content_type = synthesize_cartesia(
                api_key=config.cartesia_api_key,
                model_id=config.tts_model_name,
                voice_id=config.tts_voice_name,
                text=text,
            )
        else:
            audio, content_type = synthesize_bangla(
                api_key=config.api_key,
                model_name=config.tts_model_name,
                voice_name=config.tts_voice_name,
                text=text,
            )
    except Exception as error:
        return JsonResponse({"error": str(error)}, status=502)
        
    response = HttpResponse(audio, content_type=content_type)
    response["Cache-Control"] = "private, max-age=60"
    return response


@csrf_exempt
@require_http_methods(["POST"])
@api_auth()
def agent_chat(request):
    data = body_json(request)
    if data is None:
        return JsonResponse({"error": "Invalid JSON."}, status=400)
    message = str(data.get("message", "")).strip()
    if not message:
        return JsonResponse({"error": "Message is required."}, status=400)
    config = AIConfiguration.current()
    if not config.is_enabled or not config.api_key:
        return JsonResponse({"error": "The AI assistant is not configured yet. Ask an administrator to add a Gemini API key."}, status=503)

    conversation = None
    conversation_id = data.get("conversationId")
    if conversation_id:
        conversation = Conversation.objects.filter(id=conversation_id, user=request.api_user).first()
        if not conversation:
            return JsonResponse({"error": "Conversation not found."}, status=404)
    else:
        conversation = Conversation.objects.create(user=request.api_user, title=message[:80])

    ChatMessage.objects.create(conversation=conversation, role="user", content=message)
    recent = list(conversation.messages.order_by("-created_at")[:12])[::-1]
    contents = [{"role": item.role, "parts": [{"text": item.content}]} for item in recent]
    mode = data.get("mode", "qa")
    system_prompt = config.system_prompt
    
    if mode == "qa":
        docs = KnowledgeDocument.objects.all()
        if docs.exists():
            rag_context = "\n\n".join([f"Document: {d.title}\n{d.content}" for d in docs])
            system_prompt += f"\n\nHere is some knowledge base context you should use to answer user queries. ONLY answer questions related to the software/services described below. If the user asks something completely unrelated, politely refuse to answer. \n\nCONTEXT:\n{rag_context}"
        else:
            system_prompt += "\n\nONLY answer questions related to the software/services. If the user asks something completely unrelated, politely refuse to answer."

    try:
        reply = generate_content(
            api_key=config.api_key,
            model_name=config.model_name,
            contents=contents,
            system_prompt=system_prompt,
        )
    except GeminiError as error:
        return JsonResponse({"error": str(error)}, status=502)
    ChatMessage.objects.create(conversation=conversation, role="model", content=reply)
    return JsonResponse({"conversationId": conversation.id, "reply": reply, "model": config.model_name})


@csrf_exempt
@require_http_methods(["POST"])
@api_auth()
def cash_out_start(request):
    session = CashOutSession.objects.create(user=request.api_user)
    return JsonResponse(session_payload(session), status=201)

from .agents.langgraph_agent import process_voice_command

@csrf_exempt
@require_http_methods(["POST"])
def voice_agent_run(request):
    data = body_json(request) or {}
    transcript = str(data.get("transcript", "")).strip()
    current_page = str(data.get("currentPage", "home"))
    current_step = str(data.get("currentStep", ""))
    mode = str(data.get("mode", "ui_operator"))
    conversation_history = data.get("conversationHistory", [])
    
    print(f"[VOICE AGENT] page={current_page} step={current_step} transcript={transcript!r}")
    print(f"[VOICE AGENT] history_len={len(conversation_history)} history={conversation_history[-3:] if conversation_history else []}")
    
    if not transcript:
        return JsonResponse({"actions": []})
        
    config = AIConfiguration.current()
    if not config.is_enabled or not config.api_key:
        return JsonResponse({"error": "Gemini not configured"}, status=503)
        
    try:
        actions = process_voice_command(transcript, current_page, current_step, mode, conversation_history)
        return JsonResponse({"actions": actions})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)



@require_http_methods(["GET"])
def health(request):
    return JsonResponse({"status": "ok", "service": "sohoj-pay-api"})

from .models import Contact, Transaction

@csrf_exempt
@require_http_methods(["GET", "POST"])
@api_auth()
def contacts_api(request):
    if request.method == "POST":
        data = body_json(request) or {}
        name = data.get("name", "")
        number = data.get("number", "")
        ctype = data.get("type", "Agent")
        avatar = data.get("avatar", "👤")
        if not name or not number:
            return JsonResponse({"error": "Name and number are required"}, status=400)
        c = Contact.objects.create(user=request.api_user, name=name, number=number, type=ctype, avatar=avatar)
        return JsonResponse({"id": c.id, "name": c.name, "number": c.number, "type": c.type, "avatar": c.avatar})
    else:
        contacts = request.api_user.contacts.order_by("-created_at")
        payload = [{"id": c.id, "name": c.name, "number": c.number, "type": c.type, "avatar": c.avatar} for c in contacts]
        return JsonResponse(payload, safe=False)


@csrf_exempt
@require_http_methods(["GET", "POST"])
@api_auth()
def transactions_api(request):
    if request.method == "POST":
        data = body_json(request) or {}
        type_ = data.get("type", "")
        amount = data.get("amount", "")
        recipient = data.get("recipient", "")
        date = data.get("date", "Today")
        status = data.get("status", "Success")
        icon = data.get("icon", "transfer")
        color = data.get("color", "blue")
        if not type_ or not amount or not recipient:
            return JsonResponse({"error": "Missing required fields"}, status=400)
        t = Transaction.objects.create(user=request.api_user, type=type_, amount=amount, recipient=recipient, date=date, status=status, icon=icon, color=color)
        return JsonResponse({"id": t.id, "type": t.type, "amount": t.amount, "recipient": t.recipient, "date": t.date, "status": t.status, "icon": t.icon, "color": t.color})
    else:
        transactions = request.api_user.transactions.order_by("-created_at")
        payload = [{"id": t.id, "type": t.type, "amount": t.amount, "recipient": t.recipient, "date": t.date, "status": t.status, "icon": t.icon, "color": t.color} for t in transactions]
        return JsonResponse(payload, safe=False)
