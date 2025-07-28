from django.http import HttpResponsePermanentRedirect
class WwwRedirectMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
    def __call__(self, request):
        host = request.get_host().partition(':')[0]
        if host == "greatideas.ru":
            return HttpResponsePermanentRedirect("https://www.greatideas.ru" + request.get_full_path())
        return self.get_response(request)
