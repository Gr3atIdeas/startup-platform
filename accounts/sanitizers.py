import bleach
from django.conf import settings
from urllib.parse import urlparse
from bs4 import BeautifulSoup


def sanitize_description_html(html_content):
    """
    Санитизирует HTML контент описания, оставляя только безопасные теги и атрибуты.
    """
    if not html_content:
        return ""
    
    # Разрешенные теги
    allowed_tags = [
        'img', 'video', 'p', 'br', 'strong', 'em', 'b', 'i', 'u', 'ul', 'ol', 'li',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span', 'blockquote', 'a'
    ]
    
    # Разрешенные атрибуты
    allowed_attributes = {
        'img': ['src', 'alt', 'width', 'height', 'class'],
        'video': ['src', 'controls', 'width', 'height', 'class', 'poster'],
        'a': ['href', 'target', 'rel', 'title'],
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
        strip=True
    )
    
    # Дополнительная проверка URL в src атрибутах
    cleaned_html = validate_media_urls(cleaned_html)
    
    # Преобразуем URL в ссылки, если они не обернуты в теги
    cleaned_html = convert_urls_to_links(cleaned_html)
    
    # Валидация и очистка ссылок
    cleaned_html = validate_links(cleaned_html)
    
    return cleaned_html


def validate_media_urls(html_content):
    """
    Проверяет, что все URL в src атрибутах ведут на разрешенные домены.
    """
    
    try:
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Получаем разрешенные домены из настроек
        allowed_domains = [
            getattr(settings, 'AWS_S3_PUBLIC_BASE_URL', ''),
            getattr(settings, 'S3_PUBLIC_BASE_URL', ''),
            'storage.yandexcloud.net',
            getattr(settings, 'AWS_S3_ENDPOINT_URL', ''),
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


def convert_urls_to_links(html_content):
    """
    Преобразует URL в тексте в кликабельные ссылки, если они не обернуты в теги <a>.
    """
    import re
    
    if not html_content:
        return ""
    
    try:
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Регулярное выражение для поиска URL
        url_pattern = re.compile(
            r'https?://[^\s<>"{}|\\^`\[\]]+[^\s<>"{}|\\^`\[\].,;:!?]',
            re.IGNORECASE
        )
        
        # Обрабатываем все текстовые узлы
        from bs4 import NavigableString
        
        for text_node in soup.find_all(string=True):
            parent = text_node.parent
            if parent and parent.name not in ['a', 'script', 'style']:
                text = str(text_node)
                # Проверяем, есть ли URL в тексте
                if url_pattern.search(text):
                    # Разбиваем текст на части и заменяем URL на ссылки
                    parts = []
                    last_end = 0
                    for match in url_pattern.finditer(text):
                        # Добавляем текст до URL
                        if match.start() > last_end:
                            parts.append(NavigableString(text[last_end:match.start()]))
                        # Добавляем ссылку
                        url = match.group(0)
                        link_tag = soup.new_tag('a', href=url, target='_blank', rel='noopener noreferrer')
                        link_tag.string = url
                        parts.append(link_tag)
                        last_end = match.end()
                    # Добавляем оставшийся текст
                    if last_end < len(text):
                        parts.append(NavigableString(text[last_end:]))
                    
                    # Заменяем текстовый узел на новые элементы
                    if parts:
                        text_node.replace_with(*parts)
        
        return str(soup)
    except Exception:
        return html_content


def validate_links(html_content):
    """
    Валидирует и очищает ссылки, добавляя rel="noopener noreferrer" для безопасности.
    """
    if not html_content:
        return ""
    
    try:
        soup = BeautifulSoup(html_content, 'html.parser')
        
        for link in soup.find_all('a'):
            href = link.get('href', '')
            if href:
                # Проверяем, что это валидный URL
                parsed = urlparse(href)
                if parsed.scheme in ['http', 'https'] or (not parsed.scheme and parsed.path):
                    # Добавляем target="_blank" если его нет
                    if not link.get('target'):
                        link['target'] = '_blank'
                    # Добавляем rel="noopener noreferrer" для безопасности
                    if not link.get('rel'):
                        link['rel'] = 'noopener noreferrer'
                else:
                    # Удаляем невалидные ссылки
                    link.unwrap()
        
        return str(soup)
    except Exception:
        return html_content
