from django.shortcuts import redirect

class WwwRedirectMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        host = request.get_host().partition(':')[0]
        if host == "greatideas.ru":
            return redirect(f"https://www.greatideas.ru{request.path}", permanent=True)
        return self.get_response(request) 