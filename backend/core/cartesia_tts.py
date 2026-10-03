import json
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


def synthesize_cartesia(*, api_key, model_id, voice_id, text, timeout=25):
    if not api_key:
        raise ValueError("No Cartesia API key is configured.")

    url = "https://api.cartesia.ai/tts/bytes"
    payload = {
        "model_id": model_id or "sonic-multilingual",
        "transcript": text,
        "voice": {
            "mode": "id",
            "id": voice_id or "9626c31c-bec5-4cca-baa8-f8ba9e84c8bc"
        },
        "output_format": {
            "container": "wav",
            "encoding": "pcm_f32le",
            "sample_rate": 44100
        }
    }
    
    headers = {
        "X-API-Key": api_key,
        "Cartesia-Version": "2024-06-10",
        "Content-Type": "application/json"
    }
    
    request = Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST",
    )
    
    try:
        with urlopen(request, timeout=timeout) as response:
            audio_bytes = response.read()
            return audio_bytes, "audio/wav"
    except HTTPError as error:
        try:
            detail = json.loads(error.read().decode("utf-8"))
        except Exception:
            detail = str(error)
        raise Exception(f"Cartesia TTS Error {error.code}: {detail}")
    except (URLError, TimeoutError) as error:
        raise Exception(f"Could not reach Cartesia TTS: {error}")
