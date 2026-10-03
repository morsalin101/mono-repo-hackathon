import json
from unittest.mock import patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings


@override_settings(DEBUG=True)
class ApiTests(TestCase):
    def post_json(self, path, data, token=None):
        headers = {"HTTP_AUTHORIZATION": f"Bearer {token}"} if token else {}
        return self.client.post(path, data=json.dumps(data), content_type="application/json", **headers)

    def quick_login(self, role):
        response = self.post_json("/api/auth/quick-login/", {"role": role})
        self.assertEqual(response.status_code, 200)
        return response.json()["token"]

    def test_quick_login_and_me(self):
        token = self.quick_login("user")
        response = self.client.get("/api/auth/me/", HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["user"]["role"], "user")

    def test_user_cannot_open_ai_settings(self):
        token = self.quick_login("user")
        response = self.client.get("/api/admin/ai-settings/", HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(response.status_code, 403)

    @patch("core.views.generate_content", return_value="Connection successful")
    def test_admin_can_save_and_test_ai_settings(self, generate):
        token = self.quick_login("admin")
        headers = {"HTTP_AUTHORIZATION": f"Bearer {token}"}
        response = self.client.put(
            "/api/admin/ai-settings/",
            data=json.dumps({
                "provider": "gemini",
                "modelName": "gemini-test",
                "apiKey": "secret-key",
                "systemPrompt": "Be helpful.",
                "isEnabled": True,
            }),
            content_type="application/json",
            **headers,
        )
        self.assertEqual(response.status_code, 200)
        self.assertNotIn("secret-key", response.content.decode())
        response = self.post_json("/api/admin/ai-settings/test/", {}, token)
        self.assertEqual(response.status_code, 200)
        generate.assert_called_once()

    @patch("core.views.generate_content", return_value="আমি সাহায্য করতে পারি।")
    def test_configured_user_can_chat(self, generate):
        admin_token = self.quick_login("admin")
        self.client.put(
            "/api/admin/ai-settings/",
            data=json.dumps({"provider": "gemini", "modelName": "gemini-test", "apiKey": "secret", "systemPrompt": "Help.", "isEnabled": True}),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {admin_token}",
        )
        user_token = self.quick_login("user")
        response = self.post_json("/api/agent/chat/", {"message": "সাহায্য করুন"}, user_token)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["reply"], "আমি সাহায্য করতে পারি।")
        self.assertTrue(response.json()["conversationId"])

    def test_cash_out_flow_requires_each_confirmation(self):
        token = self.quick_login("user")
        start = self.post_json("/api/agent/cash-out/start/", {}, token).json()
        session_id = start["sessionId"]

        def turn(**data):
            return self.post_json("/api/agent/cash-out/turn/", {"sessionId": session_id, **data}, token).json()

        self.assertEqual(turn(text="আমি ক্যাশ আউট করতে চাই")["state"], "CONFIRM_INTENT")
        self.assertEqual(turn(action="confirm")["state"], "ASK_RECIPIENT")
        self.assertEqual(turn(contactId="karim-store")["state"], "CONFIRM_RECIPIENT")
        self.assertEqual(turn(action="confirm")["state"], "ASK_AMOUNT")
        self.assertEqual(turn(amount=500)["state"], "CONFIRM_AMOUNT")
        self.assertEqual(turn(action="confirm")["state"], "REVIEW")
        completed = turn(action="confirm")
        self.assertEqual(completed["state"], "COMPLETE")
        self.assertEqual(completed["draft"]["total"], 509.25)

    @patch("core.cash_out_agent.interpret_turn")
    def test_audio_turn_updates_flow_from_transcript(self, interpret):
        interpret.return_value = {
            "transcript": "আমি ক্যাশ আউট করতে চাই",
            "intent": "cash_out",
            "decision": "unknown",
            "phone": "",
            "amount": None,
            "recipientName": "",
        }
        token = self.quick_login("user")
        session_id = self.post_json("/api/agent/cash-out/start/", {}, token).json()["sessionId"]
        audio = SimpleUploadedFile("voice.webm", b"fake-audio", content_type="audio/webm")
        response = self.client.post(
            "/api/agent/cash-out/audio/",
            {"sessionId": session_id, "audio": audio},
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["state"], "CONFIRM_INTENT")

    @patch("core.views.synthesize_bangla", return_value=(b"RIFF-test-audio", "audio/wav"))
    def test_cash_out_prompt_can_return_bangla_speech(self, synthesize):
        token = self.quick_login("user")
        session_id = self.post_json("/api/agent/cash-out/start/", {}, token).json()["sessionId"]
        response = self.post_json("/api/agent/cash-out/speech/", {"sessionId": session_id}, token)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "audio/wav")
        self.assertEqual(response.content, b"RIFF-test-audio")
        self.assertIn("আসসালামু আলাইকুম", synthesize.call_args.kwargs["text"])

    @patch("core.views.synthesize_bangla", return_value=(b"RIFF-test-audio", "audio/wav"))
    def test_recipient_speech_does_not_read_question_mark_or_mask(self, synthesize):
        token = self.quick_login("user")
        session_id = self.post_json("/api/agent/cash-out/start/", {}, token).json()["sessionId"]
        self.post_json("/api/agent/cash-out/turn/", {"sessionId": session_id, "action": "start_cash_out"}, token)
        self.post_json("/api/agent/cash-out/turn/", {"sessionId": session_id, "action": "confirm"}, token)
        self.post_json("/api/agent/cash-out/turn/", {"sessionId": session_id, "contactId": "karim-store"}, token)
        response = self.post_json("/api/agent/cash-out/speech/", {"sessionId": session_id}, token)
        self.assertEqual(response.status_code, 200)
        spoken = synthesize.call_args.kwargs["text"]
        self.assertNotIn("?", spoken)
        self.assertNotIn("•", spoken)
        self.assertIn("শেষ চার সংখ্যা ৫ ৬ ৭ ৮", spoken)
