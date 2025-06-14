import os


def display_directory_structure(start_path, indent="", prefix=""):
    """Рекурсивно выводит структуру директорий и файлов."""
    # Получаем список всех элементов в текущей директории
    items = sorted(os.listdir(start_path))

    for index, item in enumerate(items):
        # Формируем полный путь к элементу
        item_path = os.path.join(start_path, item)

        # Определяем, является ли элемент последним в списке
        is_last = index == len(items) - 1

        # Формируем префикс для вывода
        current_prefix = prefix + ("└── " if is_last else "├── ")
        next_prefix = prefix + ("    " if is_last else "│   ")

        # Выводим имя элемента
        print(current_prefix + item)

        # Если это директория, рекурсивно обходим её
        if os.path.isdir(item_path):
            display_directory_structure(item_path, indent, next_prefix)


if __name__ == "__main__":
    # Корневая директория — текущая директория, где запущен скрипт
    root_dir = os.getcwd()
    print(f"Структура проекта в {root_dir}:")
    print(".")
    display_directory_structure(root_dir)
