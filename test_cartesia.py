import urllib.request
import json

url = "http://localhost:3000/api/admin/ai-settings/tts-test/"
payload = {
    "ttsProvider": "cartesia",
    "ttsModelName": "sonic-multilingual",
    "ttsVoiceName": "9626c31c-bec5-4cca-baa8-f8ba9e84c8bc",
    "cartesiaApiKey": "sk_car_rmYfP6tZaMDj46UqnfJBnt"
}
req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers={"Content-Type": "application/json"}, method="POST")
try:
    with urllib.request.urlopen(req) as response:
        print("Status:", response.status)
        print("Content-Type:", response.headers.get("Content-Type"))
        # Read the first few bytes to verify it's audio
        print(response.read(10))
except urllib.error.HTTPError as e:
    print("HTTPError:", e.code)
    print(e.read().decode("utf-8"))
