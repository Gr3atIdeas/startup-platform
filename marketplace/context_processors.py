from django.conf import settings


def s3_public_base_url(request):
    return {
        "S3_PUBLIC_BASE_URL": getattr(settings, "S3_PUBLIC_BASE_URL", ""),
        "AWS_S3_PUBLIC_BASE_URL": getattr(settings, "AWS_S3_PUBLIC_BASE_URL", "")
    }


