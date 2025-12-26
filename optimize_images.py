"""
Скрипт для оптимизации изображений.
Конвертирует PNG в WebP для уменьшения размера файлов.

Требует установки Pillow: pip install Pillow

Запуск: python optimize_images.py
"""
import os
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Pillow не установлен. Установите: pip install Pillow")
    exit(1)


def convert_to_webp(input_path, output_path, quality=85):
    """Конвертирует изображение в WebP формат."""
    try:
        with Image.open(input_path) as img:
            # Сохраняем альфа-канал если есть
            if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
                img = img.convert('RGBA')
            else:
                img = img.convert('RGB')
            
            img.save(output_path, 'WEBP', quality=quality, optimize=True)
            
            original_size = os.path.getsize(input_path)
            new_size = os.path.getsize(output_path)
            reduction = (1 - new_size / original_size) * 100
            
            print(f"✓ {input_path.name}: {original_size/1024:.1f}KB -> {new_size/1024:.1f}KB ({reduction:.1f}% reduction)")
            return True
    except Exception as e:
        print(f"✗ Ошибка обработки {input_path}: {e}")
        return False


def resize_image(input_path, output_path, max_size=(200, 200), quality=85):
    """Изменяет размер изображения и сохраняет как WebP."""
    try:
        with Image.open(input_path) as img:
            # Сохраняем альфа-канал
            if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
                img = img.convert('RGBA')
            else:
                img = img.convert('RGB')
            
            # Изменяем размер с сохранением пропорций
            img.thumbnail(max_size, Image.Resampling.LANCZOS)
            
            img.save(output_path, 'WEBP', quality=quality, optimize=True)
            
            original_size = os.path.getsize(input_path)
            new_size = os.path.getsize(output_path)
            reduction = (1 - new_size / original_size) * 100
            
            print(f"✓ {input_path.name} (resized): {original_size/1024:.1f}KB -> {new_size/1024:.1f}KB ({reduction:.1f}% reduction)")
            return True
    except Exception as e:
        print(f"✗ Ошибка обработки {input_path}: {e}")
        return False


def main():
    base_path = Path(__file__).parent / "static" / "accounts" / "images"
    
    # Папки для оптимизации
    folders_to_optimize = [
        ("planetary_system/categories", 100, 100),  # Иконки категорий - уменьшаем до 100x100
        ("categories", 100, 100),  # Другие иконки категорий
        ("planetary_system/planets_round", 150, 150),  # Планеты
        ("planetary_system/planets_ring", 150, 150),
    ]
    
    total_saved = 0
    
    for folder, max_w, max_h in folders_to_optimize:
        folder_path = base_path / folder
        if not folder_path.exists():
            print(f"Папка не найдена: {folder_path}")
            continue
            
        print(f"\n=== Обработка {folder} ===")
        
        for file_path in folder_path.glob("*.png"):
            if file_path.name.endswith("_optimized.webp"):
                continue
                
            webp_path = file_path.with_suffix(".webp")
            
            original_size = os.path.getsize(file_path)
            
            # Изменяем размер и конвертируем
            if resize_image(file_path, webp_path, (max_w, max_h)):
                new_size = os.path.getsize(webp_path)
                total_saved += original_size - new_size
    
    print(f"\n=== ИТОГО ===")
    print(f"Сэкономлено: {total_saved/1024/1024:.2f} MB")


if __name__ == "__main__":
    main()
