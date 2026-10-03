from functools import wraps

from django.http import JsonResponse
from django.utils import timezone

from .models import ApiToken


def get_request_user(request):
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return None
    try:
        token = ApiToken.objects.select_related("user").get(key=header[7:])
    except ApiToken.DoesNotExist:
        return None
    token.last_used_at = timezone.now()
    token.save(update_fields=["last_used_at"])
    return token.user if token.user.is_active else None


def api_auth(admin_only=False):
    def decorator(view):
        @wraps(view)
        def wrapped(request, *args, **kwargs):
            user = get_request_user(request)
            if not user:
                return JsonResponse({"error": "Authentication required."}, status=401)
            if admin_only and not user.is_staff:
                return JsonResponse({"error": "Administrator access required."}, status=403)
            request.api_user = user
            return view(request, *args, **kwargs)

        return wrapped

    return decorator
