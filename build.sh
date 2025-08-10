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
echo "--- Prechecking agencies migration consistency ---"
AGENCIES_EXISTS=$(python - <<'PY'
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'marketplace.settings')
try:
    import django
    django.setup()
    from django.db import connection
    print('yes' if 'agencies' in connection.introspection.table_names() else 'no')
except Exception:
    print('error')
PY
)

if [ "$AGENCIES_EXISTS" = "yes" ]; then
  echo "Table 'agencies' exists. Faking migration accounts 0036_create_agencies to avoid duplicate table error."
  python manage.py migrate accounts 0036_create_agencies --fake || true
fi

python manage.py migrate --noinput

echo "--- Collecting static files ---"

/opt/render/project/src/.venv/bin/python manage.py collectstatic --noinput --clear

echo "--- Build successful ---"
