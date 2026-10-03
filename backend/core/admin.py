from django.contrib import admin

from .models import AIConfiguration, ApiToken, CashOutSession, ChatMessage, Conversation


admin.site.register(AIConfiguration)
admin.site.register(ApiToken)
admin.site.register(Conversation)
admin.site.register(ChatMessage)
admin.site.register(CashOutSession)
