from django.urls import path

from . import views


urlpatterns = [
    path("health/", views.health),
    path("config/", views.public_config),
    path("auth/login/", views.login),
    path("auth/quick-login/", views.quick_login),
    path("auth/logout/", views.logout),
    path("auth/me/", views.me),
    path("admin/ai-settings/", views.ai_settings),
    path("admin/ai-settings/test/", views.test_ai_connection),
    path("admin/ai-settings/tts-test/", views.test_tts_connection),
    path("admin/knowledge/", views.knowledge_documents),
    path("admin/knowledge/<int:doc_id>/", views.knowledge_document_detail),
    path("agent/tts/", views.general_tts),
    path("agent/chat/", views.agent_chat),
    path("agent/voice-agent/", views.voice_agent_run),
    path("contacts/", views.contacts_api),
    path("transactions/", views.transactions_api),
]
