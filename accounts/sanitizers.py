import bleach
from bleach.css_sanitizer import CSSSanitizer
from django.conf import settings
from urllib.parse import urlparse
from bs4 import BeautifulSoup


def sanitize_description_html(html_content):
    if not html_content:
        return ""

    allowed_tags = [
        'img', 'video', 'p', 'br', 'strong', 'em', 'b', 'i', 'u', 's',
        'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'div', 'span', 'blockquote', 'a',
        'figure', 'figcaption',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
    ]

    allowed_attributes = {
        'img': ['src', 'alt', 'width', 'height', 'class'],
        'video': ['src', 'controls', 'width', 'height', 'class', 'poster'],
        'a': ['href', 'target', 'rel', 'title'],
        '*': ['class', 'style']
    }

    css_sanitizer = CSSSanitizer(allowed_css_properties=[
        'font-size', 'font-weight', 'text-align',
        'margin', 'padding', 'width', 'height', 'max-width', 'max-height'
    ])

    cleaned_html = bleach.clean(
        html_content,
        tags=allowed_tags,
        attributes=allowed_attributes,
        css_sanitizer=css_sanitizer,
        strip=True
    )
    
    cleaned_html = validate_media_urls(cleaned_html)
    cleaned_html = convert_urls_to_links(cleaned_html)
    cleaned_html = validate_links(cleaned_html)
    
    return cleaned_html


def validate_media_urls(html_content):
    try:
        soup = BeautifulSoup(html_content, 'html.parser')
        
        allowed_domains = [
            getattr(settings, 'AWS_S3_PUBLIC_BASE_URL', ''),
            getattr(settings, 'S3_PUBLIC_BASE_URL', ''),
            'storage.yandexcloud.net',
            getattr(settings, 'AWS_S3_ENDPOINT_URL', ''),
        ]
        allowed_domains = [domain for domain in allowed_domains if domain]
        
        for tag in soup.find_all(['img', 'video']):
            src = tag.get('src')
            if src:
                parsed_url = urlparse(src)
                if not parsed_url.netloc or any(domain in src for domain in allowed_domains):
                    continue
                else:
                    tag.decompose()
        
        return str(soup)
    except Exception:
        return html_content


def extract_media_urls(html_content):
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
    import re
    
    if not html_content:
        return ""
    
    try:
        soup = BeautifulSoup(html_content, 'html.parser')
        
        url_pattern = re.compile(
            r'https?://[^\s<>"{}|\\^`\[\]]+[^\s<>"{}|\\^`\[\].,;:!?]',
            re.IGNORECASE
        )
        
        from bs4 import NavigableString
        
        for text_node in soup.find_all(string=True):
            parent = text_node.parent
            if parent and parent.name not in ['a', 'script', 'style']:
                text = str(text_node)
                if url_pattern.search(text):
                    parts = []
                    last_end = 0
                    for match in url_pattern.finditer(text):
                        if match.start() > last_end:
                            parts.append(NavigableString(text[last_end:match.start()]))
                        url = match.group(0)
                        link_tag = soup.new_tag('a', href=url, target='_blank', rel='noopener noreferrer')
                        link_tag.string = url
                        parts.append(link_tag)
                        last_end = match.end()
                    if last_end < len(text):
                        parts.append(NavigableString(text[last_end:]))
                    
                    if parts:
                        text_node.replace_with(*parts)
        
        return str(soup)
    except Exception:
        return html_content


def validate_links(html_content):
    if not html_content:
        return ""
    
    try:
        soup = BeautifulSoup(html_content, 'html.parser')
        
        for link in soup.find_all('a'):
            href = link.get('href', '')
            if href:
                parsed = urlparse(href)
                if parsed.scheme in ['http', 'https'] or (not parsed.scheme and parsed.path):
                    if not link.get('target'):
                        link['target'] = '_blank'
                    if not link.get('rel'):
                        link['rel'] = 'noopener noreferrer'
                else:
                    link.unwrap()
        
        return str(soup)
    except Exception:
        return html_content
