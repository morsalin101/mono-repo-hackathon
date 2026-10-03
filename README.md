# Sohoj Pay

Voice-assisted Bangla wallet prototype with a React/Vite frontend and Django backend.

## Run locally

Open two terminals from the repository root.

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The Vite development server proxies `/api` to Django at `http://127.0.0.1:8000`.

Use **Demo Admin** to save and test a Gemini API key, then sign out and use **Demo User** to test the assistant. Quick login is automatically disabled when `DJANGO_DEBUG=false`.

## Test the cash-out agent

1. Quick-login as **Demo Admin**.
2. Save a valid Gemini API key. Keep the agent model as `gemini-2.5-flash` and the TTS model as `gemini-2.5-flash-preview-tts`.
3. Use **Test connection** and **Test Bangla voice**, then sign out.
4. Quick-login as **Demo User**.
5. Enable **Voice assistance** and tap the microphone. Speak in Bangla, or type `আমি ৫০০ টাকা ক্যাশ আউট করতে চাই`.

Gemini 2.5 Flash accepts the recorded audio and returns structured text. Django owns the state machine and validates every UI transition. Gemini TTS generates Bangla audio for each approved prompt; browser Bangla speech is used as a fallback. This demo stops before PIN authorization and never transfers money.

Microphone access works on `localhost` or HTTPS. If recording is unavailable, every step also accepts typed input and explicit buttons.

## Run with Docker

```bash
docker compose up --build
```

Open `http://localhost:3000`. Django migrations run automatically, and the SQLite database is persisted in the `django_data` volume.

Stop the containers without deleting the database:

```bash
docker compose down
```

## API routes

- `POST /api/auth/login/`
- `POST /api/auth/quick-login/`
- `GET /api/auth/me/`
- `GET|PUT /api/admin/ai-settings/` (administrator only)
- `POST /api/admin/ai-settings/test/` (administrator only)
- `POST /api/agent/chat/`
- `POST /api/agent/cash-out/start/`
- `POST /api/agent/cash-out/turn/`
- `POST /api/agent/cash-out/audio/`

The API key is never returned to the frontend. For production, move it from the local database to an encrypted secrets manager or KMS-backed field.
