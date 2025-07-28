import os
import re
EXCLUDE_DIRS = {'.git', '__pycache__', 'node_modules', 'migrations'}
print("Скрипт запущен!")
def strip_python_comments(lines):
    result = []
    in_docstring = False
    docstring_char = None
    for line in lines:
        stripped = line.lstrip()
        if (stripped.startswith('"""') or stripped.startswith("'''")):
            if not in_docstring:
                in_docstring = True
                docstring_char = stripped[:3]
            elif in_docstring and stripped.startswith(docstring_char):
                in_docstring = False
                docstring_char = None
            result.append(line)
            continue
        if in_docstring:
            result.append(line)
            continue
        if stripped.startswith('#'):
            continue
        new_line = ''
        in_string = False
        string_char = None
        i = 0
        while i < len(line):
            char = line[i]
            if char in '"\'' and (i == 0 or line[i-1] != '\\'):
                if not in_string:
                    in_string = True
                    string_char = char
                elif string_char == char:
                    in_string = False
                    string_char = None
            if char == '#' and not in_string:
                break
            new_line += char
            i += 1
        if new_line.rstrip():
            result.append(new_line.rstrip() + '\n')
    return result
def strip_html_comments(text):
    text = re.sub(r'\{#.*?#\}', '', text, flags=re.DOTALL)
    text = re.sub(r'<!--.*?-->', '', text, flags=re.DOTALL)
    return text
def strip_js_comments(lines):
    result = []
    for line in lines:
        stripped = line.lstrip()
        if stripped.startswith('//'):
            continue
        new_line = ''
        in_string = False
        string_char = None
        i = 0
        while i < len(line):
            char = line[i]
            if char in '"\'' and (i == 0 or line[i-1] != '\\'):
                if not in_string:
                    in_string = True
                    string_char = char
                elif string_char == char:
                    in_string = False
                    string_char = None
            if i < len(line)-1 and line[i:i+2] == '//' and not in_string:
                break
            new_line += char
            i += 1
        if new_line.rstrip():
            result.append(new_line.rstrip() + '\n')
    return result
def strip_css_comments(text):
    return re.sub(r'/\*.*?\*/', '', text, flags=re.DOTALL)
def process_file(path):
    ext = os.path.splitext(path)[1]
    if ext == '.py':
        with open(path, encoding='utf-8') as f:
            lines = f.readlines()
        new_lines = strip_python_comments(lines)
        with open(path, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
    elif ext == '.html':
        with open(path, encoding='utf-8') as f:
            text = f.read()
        new_text = strip_html_comments(text)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(new_text)
    elif ext == '.js':
        with open(path, encoding='utf-8') as f:
            lines = f.readlines()
        new_lines = strip_js_comments(lines)
        with open(path, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
    elif ext == '.css':
        with open(path, encoding='utf-8') as f:
            text = f.read()
        new_text = strip_css_comments(text)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(new_text)
def walk_and_process(root):
    processed_count = 0
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in EXCLUDE_DIRS]
        for filename in filenames:
            path = os.path.join(dirpath, filename)
            ext = os.path.splitext(filename)[1]
            if ext in ['.py', '.html', '.js', '.css']:
                try:
                    process_file(path)
                    processed_count += 1
                    print(f'Очищено: {path}')
                except Exception as e:
                    print(f'Ошибка в {path}: {e}')
    print(f'Всего обработано файлов: {processed_count}')
if __name__ == '__main__':
    print("Начинаю обработку файлов...")
    walk_and_process('.')
    print('Удаление комментариев завершено!')
