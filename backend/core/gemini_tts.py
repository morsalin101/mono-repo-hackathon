import base64
import io
import json
import wave
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

from .gemini import GeminiError


def _pcm_to_wav(pcm, sample_rate=24000):
    output = io.BytesIO()
    with wave.open(output, "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(sample_rate)
        wav.writeframes(pcm)
    return output.getvalue()


def synthesize_bangla(*, api_key, model_name, voice_name, text, timeout=25):
    if not api_key:
        raise GeminiError("No Gemini API key is configured.")

    def _attempt_tts(model):
        model = quote(model.removeprefix("models/"), safe="-_.")
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
        payload = {
            "contents": [{"role": "user", "parts": [{"text": text}]}],
            "generationConfig": {
                "responseModalities": ["AUDIO"],
                "speechConfig": {
                    "voiceConfig": {
                        "prebuiltVoiceConfig": {"voiceName": voice_name}
                    }
                },
            },
        }
        request = Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json", "x-goog-api-key": api_key},
            method="POST",
        )
        try:
            with urlopen(request, timeout=timeout) as response:
                result = json.loads(response.read().decode("utf-8"))
        except HTTPError as error:
            try:
                detail = json.loads(error.read().decode("utf-8")).get("error", {}).get("message")
            except (json.JSONDecodeError, UnicodeDecodeError):
                detail = None
            
            # If the quota is exceeded (429) and we aren't already using the standard flash model, throw a specific exception to trigger fallback
            if error.code == 429:
                raise ValueError("QuotaExceeded")
            
            raise GeminiError(detail or f"Gemini TTS returned HTTP {error.code}.") from error
        except (URLError, TimeoutError) as error:
            raise GeminiError(f"Could not reach Gemini TTS: {getattr(error, 'reason', error)}") from error
        return result

    try:
        result = _attempt_tts(model_name)
    except ValueError as e:
        if str(e) == "QuotaExceeded" and model_name != "gemini-2.5-flash":
            # Fallback to standard gemini-2.5-flash if the TTS tier is exhausted
            try:
                result = _attempt_tts("gemini-2.5-flash")
            except Exception as fallback_error:
                raise GeminiError("TTS quota exceeded, and fallback to gemini-2.5-flash also failed.") from fallback_error
        else:
            raise GeminiError("Gemini TTS quota exceeded.")

    try:
        inline_data = result["candidates"][0]["content"]["parts"][0]["inlineData"]
        audio = base64.b64decode(inline_data["data"])
        mime_type = inline_data.get("mimeType", "audio/L16;codec=pcm;rate=24000")
    except (KeyError, IndexError, TypeError, ValueError) as error:
        raise GeminiError("Gemini TTS returned an unexpected response.") from error

    if "wav" in mime_type.lower():
        return audio, "audio/wav"
    if "l16" in mime_type.lower() or "pcm" in mime_type.lower():
        rate = 24000
        if "rate=" in mime_type:
            try:
                rate = int(mime_type.split("rate=")[-1].split(";")[0])
            except ValueError:
                pass
        return _pcm_to_wav(audio, rate), "audio/wav"
    return audio, mime_type.split(";")[0]
