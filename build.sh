#!/usr/bin/env bash
# exit on error
set -o errexit

echo "--- STARTING BUILD SCRIPT ---"
echo "Current directory: $(pwd)"
echo "Listing files: $(ls -la)"

echo "--- CHECKING PYTHON ENVIRONMENT ---"
which python
python --version
which pip
pip --version

echo "--- INSTALLING PYTHON DEPENDENCIES ---"
pip install -r requirements.txt

echo "--- VERIFYING PYTHON DEPENDENCIES ---"
echo "--- INSTALLED PACKAGES START ---"
pip freeze
echo "--- INSTALLED PACKAGES END ---"

echo "--- INSTALLING JS DEPENDENCIES ---"
npm install

echo "--- BUILDING FRONTEND ---"
npm run build

echo "--- COLLECTING STATIC FILES ---"
python manage.py collectstatic --noinput

echo "--- BUILD SCRIPT FINISHED SUCCESSFULLY ---" 