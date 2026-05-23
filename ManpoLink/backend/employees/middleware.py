from django.http import JsonResponse
from rest_framework_simplejwt.authentication import JWTAuthentication

class CheckActiveUserMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Skip authentication check for public endpoints (login, images, etc.)
        public_endpoints = ['/api/auth/login/', '/api/auth/refresh/', '/api/saved-images/']
        
        # Check if the path starts with any of the public prefixes
        if any(request.path.startswith(p) for p in public_endpoints):
            return self.get_response(request)
        
        # Try to authenticate with JWT token
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if auth_header.startswith('Bearer '):
            try:
                # Use SimpleJWT to authenticate
                authenticator = JWTAuthentication()
                auth_result = authenticator.authenticate(request)
                
                if auth_result:
                    user, _ = auth_result
                    # Check if user is active
                    if not user.is_active:
                        return JsonResponse({"error": "Account is disabled."}, status=403)
            except Exception:
                # Invalid token - let the DRF views handle it (or ignore here)
                pass
        
        return self.get_response(request)