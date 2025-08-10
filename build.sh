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
echo "--- Prechecking migration consistency for accounts app ---"
python - <<'PY'
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'marketplace.settings')
try:
    import django
    django.setup()
    from django.db import connection
    from django.db.migrations.recorder import MigrationRecorder

    tables = set(connection.introspection.table_names())
    applied = {name for app, name in MigrationRecorder(connection).applied_migrations() if app == 'accounts'}

    def run(cmd):
        import subprocess, shlex
        print(f"[precheck] $ {cmd}")
        subprocess.run(shlex.split(cmd), check=False)

    if '0036_create_agencies' not in applied and 'agencies' in tables:
        run('python manage.py migrate accounts 0036_create_agencies --fake')

    if '0037_agency_feedback' not in applied and {'agency_votes','agency_comments'}.issubset(tables):
        run('python manage.py migrate accounts 0037_agency_feedback --fake')
except Exception as e:
    print(f"[precheck] skipped due to error: {e}")
PY

python manage.py migrate --noinput

echo "--- Collecting static files ---"

/opt/render/project/src/.venv/bin/python manage.py collectstatic --noinput --clear

echo "--- Build successful ---"
