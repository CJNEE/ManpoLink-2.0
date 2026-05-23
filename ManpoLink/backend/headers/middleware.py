"""
Legacy pass-through middleware. Prefer django-cors-headers for CORS.
"""


class Middleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        return self.get_response(request)
