from django import template
from accounts.sanitizers import sanitize_description_html

register = template.Library()

@register.filter
def sanitize_html(value):
    """
    Template filter для санитизации HTML контента
    """
    return sanitize_description_html(value)
