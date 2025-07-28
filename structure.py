import os
def display_directory_structure(start_path, indent="", prefix=""):
    """Рекурсивно выводит структуру директорий и файлов."""
    items = sorted(os.listdir(start_path))

    for index, item in enumerate(items):
        item_path = os.path.join(start_path, item)

        is_last = index == len(items) - 1

        current_prefix = prefix + ("└── " if is_last else "├── ")
        next_prefix = prefix + ("    " if is_last else "│   ")

        print(current_prefix + item)

        if os.path.isdir(item_path):
            display_directory_structure(item_path, indent, next_prefix)


if __name__ == "__main__":
    root_dir = os.getcwd()
    print(f"Структура проекта в {root_dir}:")
    print(".")
    display_directory_structure(root_dir)
