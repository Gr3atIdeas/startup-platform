"""
Generate article cover images and section illustrations using Pillow.

Usage:
    python content/generate_images.py                      # all articles
    python content/generate_images.py 001_slug.json        # specific article
    python content/generate_images.py --covers-only        # only covers
    python content/generate_images.py --upload             # generate + upload to S3

Output goes to content/images/<article_slug>/
"""

import json
import math
import os
import sys
import textwrap
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageFilter

# ── Paths ────────────────────────────────────────────────────────────────────
ROOT = Path(__file__).resolve().parent.parent
ARTICLES_DIR = ROOT / "content" / "articles"
IMAGES_DIR = ROOT / "content" / "images"
FONTS_DIR = ROOT / "static" / "accounts" / "fonts"

# ── Brand colours ────────────────────────────────────────────────────────────
GRADIENT_TOP = (0, 0, 0)           # #000000
GRADIENT_MID = (0, 52, 107)        # #00346b
GRADIENT_BOT = (0, 78, 159)        # #004e9f
ACCENT_YELLOW = (255, 239, 43)     # #ffef2b
WHITE = (255, 255, 255)
WHITE_70 = (255, 255, 255, 178)
OVERLAY = (0, 0, 0, 100)

# ── Category icons (emoji fallback) ─────────────────────────────────────────
CATEGORY_LABELS = {
    "cafe": "Кафе и рестораны",
    "fastfood": "Фастфуд",
    "beauty": "Красота",
    "health": "Здоровье",
    "medicine": "Медицина",
    "finance": "Финансы",
    "education": "Образование",
    "technology": "Технологии",
    "ai": "ИИ",
    "delivery": "Доставка",
    "auto": "Автомобили",
    "transport": "Транспорт",
    "sport": "Спорт",
    "psychology": "Психология",
    "franchise": "Франшизы",
}


def _load_font(name, size):
    """Load a TTF font, fall back to default."""
    paths = [
        FONTS_DIR / name,
        FONTS_DIR / f"{name}.ttf",
    ]
    for p in paths:
        if p.exists():
            return ImageFont.truetype(str(p), size)
    # fallback
    try:
        return ImageFont.truetype("arial.ttf", size)
    except OSError:
        return ImageFont.load_default()


def _gradient(draw, width, height):
    """Draw a vertical 3-stop gradient."""
    for y in range(height):
        ratio = y / height
        if ratio < 0.4:
            t = ratio / 0.4
            r = int(GRADIENT_TOP[0] + (GRADIENT_MID[0] - GRADIENT_TOP[0]) * t)
            g = int(GRADIENT_TOP[1] + (GRADIENT_MID[1] - GRADIENT_TOP[1]) * t)
            b = int(GRADIENT_TOP[2] + (GRADIENT_MID[2] - GRADIENT_TOP[2]) * t)
        else:
            t = (ratio - 0.4) / 0.6
            r = int(GRADIENT_MID[0] + (GRADIENT_BOT[0] - GRADIENT_MID[0]) * t)
            g = int(GRADIENT_MID[1] + (GRADIENT_BOT[1] - GRADIENT_MID[1]) * t)
            b = int(GRADIENT_MID[2] + (GRADIENT_BOT[2] - GRADIENT_MID[2]) * t)
        draw.line([(0, y), (width, y)], fill=(r, g, b))


def _draw_rounded_rect(draw, xy, radius, fill):
    """Draw a rounded rectangle (Pillow <10 compat)."""
    x0, y0, x1, y1 = xy
    draw.rounded_rectangle(xy, radius=radius, fill=fill)


def _wrap_text(text, font, max_width, draw):
    """Word-wrap text to fit within max_width pixels."""
    words = text.split()
    lines = []
    current = ""
    for word in words:
        test = f"{current} {word}".strip()
        bbox = draw.textbbox((0, 0), test, font=font)
        if bbox[2] - bbox[0] <= max_width:
            current = test
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


# ── Cover generation ─────────────────────────────────────────────────────────

def generate_cover(title, category_slug="", tags="", output_path=None):
    """Generate a 1200x630 OG-image cover for an article."""
    W, H = 1200, 630
    img = Image.new("RGBA", (W, H))
    draw = ImageDraw.Draw(img)

    # Background gradient
    _gradient(draw, W, H)

    # Subtle geometric decoration
    for i in range(3):
        cx = W - 150 + i * 40
        cy = 100 + i * 80
        r = 120 - i * 30
        draw.ellipse(
            [cx - r, cy - r, cx + r, cy + r],
            fill=None,
            outline=(88, 101, 242, 40 + i * 15),
            width=2,
        )

    # Category badge
    font_cat = _load_font("Unbounded-Medium", 18)
    cat_label = CATEGORY_LABELS.get(category_slug, "Статья")
    badge_text = cat_label.upper()
    bbox = draw.textbbox((0, 0), badge_text, font=font_cat)
    bw = bbox[2] - bbox[0] + 32
    bh = bbox[3] - bbox[1] + 16
    _draw_rounded_rect(draw, (60, 60, 60 + bw, 60 + bh), radius=bh // 2, fill=ACCENT_YELLOW)
    draw.text((60 + 16, 60 + 5), badge_text, fill=(0, 0, 0), font=font_cat)

    # Title
    font_title = _load_font("Unbounded-Bold", 42)
    lines = _wrap_text(title, font_title, W - 160, draw)
    y = 140
    for line in lines[:4]:  # max 4 lines
        draw.text((60, y), line, fill=WHITE, font=font_title)
        bbox = draw.textbbox((60, y), line, font=font_title)
        y = bbox[3] + 8

    # Tags at bottom
    if tags:
        font_tags = _load_font("Inter-Variable", 16)
        tag_list = [f"#{t.strip()}" for t in tags.split(",")[:4]]
        tag_text = "  ".join(tag_list)
        draw.text((60, H - 60), tag_text, fill=WHITE_70, font=font_tags)

    # Brand watermark
    font_brand = _load_font("Unbounded-SemiBold", 20)
    draw.text((W - 280, H - 55), "GreatIdeas.ru", fill=WHITE_70, font=font_brand)

    # Save
    result = img.convert("RGB")
    if output_path:
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        result.save(output_path, "JPEG", quality=92)
    return result


# ── Section image generation ─────────────────────────────────────────────────

def generate_section_image(
    title,
    items=None,
    image_type="infographic",
    output_path=None,
):
    """Generate an in-article section image (1200x675).

    image_type:
        - "infographic": numbered list/steps
        - "comparison": two-column comparison
        - "stats": big numbers with labels
        - "checklist": checkmark list
    """
    W, H = 1200, 675
    img = Image.new("RGBA", (W, H))
    draw = ImageDraw.Draw(img)

    # Dark background
    draw.rectangle([0, 0, W, H], fill=(10, 15, 30))

    # Accent top border
    draw.rectangle([0, 0, W, 4], fill=ACCENT_YELLOW)

    # Title
    font_title = _load_font("Unbounded-SemiBold", 28)
    lines = _wrap_text(title, font_title, W - 120, draw)
    y = 40
    for line in lines[:2]:
        draw.text((60, y), line, fill=WHITE, font=font_title)
        bbox = draw.textbbox((60, y), line, font=font_title)
        y = bbox[3] + 6

    y += 20
    items = items or []

    if image_type == "infographic":
        _draw_infographic(draw, items, y, W, H)
    elif image_type == "comparison":
        _draw_comparison(draw, items, y, W, H)
    elif image_type == "stats":
        _draw_stats(draw, items, y, W, H)
    elif image_type == "checklist":
        _draw_checklist(draw, items, y, W, H)

    # Brand
    font_brand = _load_font("Unbounded-Medium", 14)
    draw.text((W - 220, H - 40), "GreatIdeas.ru", fill=(255, 255, 255, 80), font=font_brand)

    result = img.convert("RGB")
    if output_path:
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        result.save(output_path, "JPEG", quality=90)
    return result


def _draw_infographic(draw, items, start_y, W, H):
    """Numbered steps/items with accent circles."""
    font_num = _load_font("Unbounded-Bold", 32)
    font_item = _load_font("Inter-Variable", 20)
    font_desc = _load_font("Inter-Variable", 16)

    y = start_y
    for i, item in enumerate(items[:6], 1):
        if isinstance(item, dict):
            label = item.get("label", "")
            desc = item.get("desc", "")
        else:
            label = str(item)
            desc = ""

        # Number circle
        cx, cy = 90, y + 22
        draw.ellipse([cx - 22, cy - 22, cx + 22, cy + 22], fill=ACCENT_YELLOW)
        num_text = str(i)
        bbox = draw.textbbox((0, 0), num_text, font=font_num)
        nw = bbox[2] - bbox[0]
        nh = bbox[3] - bbox[1]
        draw.text((cx - nw // 2, cy - nh // 2 - 4), num_text, fill=(0, 0, 0), font=font_num)

        # Label
        draw.text((130, y), label, fill=WHITE, font=font_item)
        if desc:
            draw.text((130, y + 30), desc, fill=WHITE_70, font=font_desc)
            y += 80
        else:
            y += 60


def _draw_comparison(draw, items, start_y, W, H):
    """Two-column comparison (items = [{"left": ..., "right": ...}, ...])."""
    font_head = _load_font("Unbounded-SemiBold", 20)
    font_item = _load_font("Inter-Variable", 18)

    mid = W // 2

    # Column headers
    if items and isinstance(items[0], dict) and "left_title" in items[0]:
        draw.text((60, start_y), items[0]["left_title"], fill=ACCENT_YELLOW, font=font_head)
        draw.text((mid + 30, start_y), items[0]["right_title"], fill=ACCENT_YELLOW, font=font_head)
        items = items[1:]
        start_y += 45

    # Divider
    draw.line([(mid, start_y), (mid, H - 50)], fill=(255, 255, 255, 40), width=1)

    y = start_y + 10
    for item in items[:8]:
        if isinstance(item, dict):
            draw.text((60, y), f"• {item.get('left', '')}", fill=WHITE, font=font_item)
            draw.text((mid + 30, y), f"• {item.get('right', '')}", fill=WHITE, font=font_item)
        y += 40


def _draw_stats(draw, items, start_y, W, H):
    """Big numbers with labels (items = [{"value": "500K", "label": "..."}, ...])."""
    font_val = _load_font("Unbounded-Bold", 52)
    font_lbl = _load_font("Inter-Variable", 16)

    count = min(len(items), 4)
    if count == 0:
        return
    col_w = (W - 120) // count

    for i, item in enumerate(items[:4]):
        if not isinstance(item, dict):
            continue
        x = 60 + i * col_w
        val = item.get("value", "")
        lbl = item.get("label", "")

        draw.text((x, start_y + 20), val, fill=ACCENT_YELLOW, font=font_val)
        draw.text((x, start_y + 85), lbl, fill=WHITE_70, font=font_lbl)


def _draw_checklist(draw, items, start_y, W, H):
    """Checkmark list."""
    font_item = _load_font("Inter-Variable", 20)

    y = start_y
    for item in items[:8]:
        text = item if isinstance(item, str) else item.get("label", str(item))
        # Checkmark
        draw.text((60, y), "✓", fill=ACCENT_YELLOW, font=font_item)
        draw.text((95, y), text, fill=WHITE, font=font_item)
        y += 45


# ── Main: process articles ───────────────────────────────────────────────────

def process_article(filepath, covers_only=False):
    """Generate all images for a single article."""
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)

    title = data.get("title", "Без заголовка")
    slug = Path(filepath).stem  # e.g. "001_top-franshiz"
    category = data.get("category_slug", "")
    tags = data.get("tags", "")

    out_dir = IMAGES_DIR / slug

    # 1. Cover
    cover_path = out_dir / "cover.jpg"
    if not cover_path.exists():
        generate_cover(title, category, tags, str(cover_path))
        print(f"  [OK] Cover: {cover_path.relative_to(ROOT)}")
    else:
        print(f"  [skip] Cover exists")

    if covers_only:
        return

    # 2. Section images
    section_images = data.get("section_images", [])
    for idx, spec in enumerate(section_images):
        img_path = out_dir / f"section_{idx + 1}.jpg"
        if img_path.exists():
            print(f"  [skip] Section {idx + 1} exists")
            continue

        generate_section_image(
            title=spec.get("title", title),
            items=spec.get("items", []),
            image_type=spec.get("type", "infographic"),
            output_path=str(img_path),
        )
        print(f"  [OK] Section {idx + 1}: {img_path.relative_to(ROOT)}")


def main():
    args = sys.argv[1:]
    covers_only = "--covers-only" in args
    args = [a for a in args if not a.startswith("--")]

    if args:
        # Specific file
        filepath = ARTICLES_DIR / args[0]
        if not filepath.exists():
            print(f"Not found: {filepath}")
            sys.exit(1)
        print(f"Processing: {args[0]}")
        process_article(filepath, covers_only)
    else:
        # All articles
        files = sorted(
            f for f in os.listdir(ARTICLES_DIR)
            if f.endswith(".json") and not f.startswith("_")
        )
        if not files:
            print("No articles found in content/articles/")
            sys.exit(0)

        for fname in files:
            print(f"\nProcessing: {fname}")
            process_article(ARTICLES_DIR / fname, covers_only)

    print("\nDone!")


if __name__ == "__main__":
    main()
