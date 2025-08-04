set -o errexit

echo "--- Installing Python dependencies ---"
pip install -r requirements.txt

echo "--- Installing JS dependencies ---"
npm install

echo "--- Building frontend ---"
npm run build

echo "--- VITE MANIFEST CONTENT ---"
cat static/dist/.vite/manifest.json || echo "Manifest file not found"
echo "--- END VITE MANIFEST CONTENT ---"

echo "--- Applying database migrations ---"
python manage.py migrate --noinput

echo "--- Adding user_rating column to comments table ---"
python manage.py add_user_rating_column

echo "--- Checking for migration conflicts ---"
python manage.py showmigrations accounts

echo "--- Checking if original filenames need to be filled ---"
# Проверяем есть ли файлы без оригинальных названий
FILES_WITHOUT_NAMES=$(python -c "
try:
    import os, sys, django
    sys.path.append('.')
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'marketplace.settings')
    django.setup()
    from accounts.models import FileStorage
    from django.db import connection
    
    # Проверяем существование колонки
    with connection.cursor() as cursor:
        cursor.execute(\"SELECT column_name FROM information_schema.columns WHERE table_name='file_storage' AND column_name='original_file_name'\")
        if not cursor.fetchone():
            print('0')  # Колонки нет
            exit()
    
    # Считаем файлы без названий
    if hasattr(FileStorage, 'original_file_name'):
        count = FileStorage.objects.filter(original_file_name__isnull=True).count() + FileStorage.objects.filter(original_file_name='').count()
        print(count)
    else:
        print('0')
except:
    print('0')
")

if [ "$FILES_WITHOUT_NAMES" -gt "0" ]; then
    echo "Found $FILES_WITHOUT_NAMES files without original names. Filling them now..."
    python manage.py fill_original_filenames
else
    echo "All files already have original names, skipping fill command."
fi

echo "--- Collecting static files ---"

/opt/render/project/src/.venv/bin/python manage.py collectstatic --noinput --clear

echo "--- Build successful ---"
