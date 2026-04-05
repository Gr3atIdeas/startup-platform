"""Custom authentication backend for email + password_hash field."""
from django.contrib.auth.hashers import check_password


class EmailPasswordBackend:
    """
    Authenticate against Users.email + Users.password_hash.

    Django's ModelBackend expects a standard 'password' DB column.
    Our Users model stores the hash in 'password_hash', so we handle
    the lookup and verification explicitly.
    """

    def authenticate(self, request, username=None, password=None, **kwargs):
        from accounts.models import Users

        if username is None or password is None:
            return None

        email = username  # USERNAME_FIELD = "email"

        try:
            user = Users.objects.get(email__iexact=email)
        except Users.DoesNotExist:
            # Run the default password hasher to mitigate timing attacks
            check_password(password, "!")
            return None

        if not user.password_hash:
            return None

        if check_password(password, user.password_hash):
            if user.is_active:
                return user

        return None

    def get_user(self, user_id):
        from accounts.models import Users

        try:
            return Users.objects.get(pk=user_id)
        except Users.DoesNotExist:
            return None
