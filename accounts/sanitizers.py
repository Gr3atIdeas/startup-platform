import bleach
from django.conf import settings
from urllib.parse import urlparse


def sanitize_description_html(html_content):
    """
    Санитизирует HTML контент описания, оставляя только безопасные теги и атрибуты.
    """
    if not html_content:
        return ""
    
    # Разрешенные теги
    allowed_tags = [
        'img', 'video', 'p', 'br', 'strong', 'em', 'b', 'i', 'u', 'ul', 'ol', 'li',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span', 'blockquote'
    ]
    
    # Разрешенные атрибуты
    allowed_attributes = {
        'img': ['src', 'alt', 'width', 'height', 'class'],
        'video': ['src', 'controls', 'width', 'height', 'class', 'poster'],
        '*': ['class', 'style']
    }
    
    # Разрешенные стили (только безопасные)
    allowed_styles = [
        'color', 'background-color', 'font-size', 'font-weight', 'text-align',
        'margin', 'padding', 'width', 'height', 'max-width', 'max-height'
    ]
    
    # Очищаем HTML
    cleaned_html = bleach.clean(
        html_content,
        tags=allowed_tags,
        attributes=allowed_attributes,
        styles=allowed_styles,
        strip=True
    )
    
    # Дополнительная проверка URL в src атрибутах
    cleaned_html = validate_media_urls(cleaned_html)
    
    return cleaned_html


def validate_media_urls(html_content):
    """
    Проверяет, что все URL в src атрибутах ведут на разрешенные домены.
    """
    from bs4 import BeautifulSoup
    
    try:
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Получаем разрешенные домены из настроек
        allowed_domains = [
            getattr(settings, 'AWS_S3_PUBLIC_BASE_URL', ''),
            getattr(settings, 'S3_PUBLIC_BASE_URL', ''),
        ]
        # Убираем пустые строки
        allowed_domains = [domain for domain in allowed_domains if domain]
        
        # Проверяем все img и video теги
        for tag in soup.find_all(['img', 'video']):
            src = tag.get('src')
            if src:
                parsed_url = urlparse(src)
                # Если это относительный URL или URL с разрешенного домена
                if not parsed_url.netloc or any(domain in src for domain in allowed_domains):
                    continue
                else:
                    # Удаляем небезопасный атрибут src
                    tag.decompose()
        
        return str(soup)
    except Exception:
        # В случае ошибки возвращаем очищенный HTML без дополнительной проверки
        return html_content


def extract_media_urls(html_content):
    """
    Извлекает все URL медиа-файлов из HTML контента.
    """
    from bs4 import BeautifulSoup
    
    urls = []
    try:
        soup = BeautifulSoup(html_content, 'html.parser')
        for tag in soup.find_all(['img', 'video']):
            src = tag.get('src')
            if src:
                urls.append(src)
    except Exception:
        pass
    
    return urls
