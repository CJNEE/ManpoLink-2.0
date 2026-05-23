"""Absolute URLs for uploaded files so UIs on other origins (e.g. Vercel) can load images."""
from django.conf import settings


def absolute_media_url(request, relative_url):
    """
    Turn ImageField/FileField `.url` (e.g. /media/profile/x.jpg) into an absolute URL.
    Uses the incoming request when present; otherwise PUBLIC_SITE_URL from settings.
    """
    if not relative_url:
        return None
    rel = relative_url if isinstance(relative_url, str) else str(relative_url)
    if not rel.startswith('/'):
        rel = f'/{rel}'
    if request:
        try:
            return request.build_absolute_uri(rel)
        except Exception:
            pass
    base = getattr(settings, 'PUBLIC_SITE_URL', '') or ''
    if base:
        return f'{base.rstrip("/")}{rel}'
    return rel
