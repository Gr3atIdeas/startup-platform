from django.contrib import admin

from .models import Startups


@admin.register(Startups)
class StartupsAdmin(admin.ModelAdmin):
    list_display = ("title", "owner", "status", "created_at")
    fields = (
        "title",
        "description",
        "direction",
        "stage",
        "funding_goal",
        "planet_logo",
        "moderator_comment",
        "status",
    )
