import json
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen


class GeminiError(Exception):
    pass


def generate_content(*, api_key, model_name, contents, system_prompt="", generation_config=None, timeout=25):
    if not api_key:
        raise GeminiError("No Gemini API key is configured.")
    if not model_name:
        raise GeminiError("A Gemini model name is required.")

    model = quote(model_name.removeprefix("models/"), safe="-_.")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    payload = {"contents": contents}
    if system_prompt:
        payload["systemInstruction"] = {"parts": [{"text": system_prompt}]}
    if generation_config:
        payload["generationConfig"] = generation_config

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
        raise GeminiError(detail or f"Gemini returned HTTP {error.code}.") from error
    except (URLError, TimeoutError) as error:
        raise GeminiError(f"Could not reach Gemini: {error.reason if isinstance(error, URLError) else error}") from error

    try:
        parts = result["candidates"][0]["content"]["parts"]
        text = "\n".join(part.get("text", "") for part in parts).strip()
    except (KeyError, IndexError, TypeError) as error:
        raise GeminiError("Gemini returned an unexpected response.") from error
    if not text:
        raise GeminiError("Gemini returned an empty response.")
    return text
