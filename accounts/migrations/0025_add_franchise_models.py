# Generated manually

from django.db import migrations, models
import django.db.models.deletion


def create_franchise_tables_if_not_exist(apps, schema_editor):
    """Создает таблицы франшиз только если они не существуют"""
    db_alias = schema_editor.connection.alias
    
    # Проверяем существование таблицы franchises
    with schema_editor.connection.cursor() as cursor:
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'franchises'
            );
        """)
        franchises_exists = cursor.fetchone()[0]
        
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'franchise_categories'
            );
        """)
        categories_exists = cursor.fetchone()[0]
    
    # Создаем таблицы только если они не существуют
    if not franchises_exists:
        schema_editor.execute("""
            CREATE TABLE franchises (
                franchise_id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                short_description TEXT,
                description TEXT,
                terms TEXT,
                investment_amount DECIMAL(19,4),
                payback_period INTEGER,
                own_businesses_count INTEGER DEFAULT 0,
                franchise_businesses_count INTEGER DEFAULT 0,
                valuation DECIMAL(19,4),
                pitch_deck_url VARCHAR(255),
                created_at TIMESTAMP,
                updated_at TIMESTAMP,
                status VARCHAR(20) DEFAULT 'pending',
                total_voters INTEGER DEFAULT 0,
                sum_votes INTEGER DEFAULT 0,
                is_edited BOOLEAN DEFAULT FALSE,
                moderator_comment TEXT,
                step_number INTEGER DEFAULT 1,
                logo_urls JSONB DEFAULT '[]',
                creatives_urls JSONB DEFAULT '[]',
                proofs_urls JSONB DEFAULT '[]',
                video_urls JSONB DEFAULT '[]',
                planet_image VARCHAR(50),
                category_id INTEGER,
                owner_id INTEGER,
                status_id INTEGER DEFAULT 3
            );
        """)
    
    if not categories_exists:
        schema_editor.execute("""
            CREATE TABLE franchise_categories (
                category_id SERIAL PRIMARY KEY,
                category_name VARCHAR(255)
            );
        """)


def reverse_franchise_tables(apps, schema_editor):
    """Удаляет таблицы франшиз"""
    schema_editor.execute("DROP TABLE IF EXISTS franchises;")
    schema_editor.execute("DROP TABLE IF EXISTS franchise_categories;")


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0024_add_vk_linkedin_to_users_only'),
    ]

    operations = [
        migrations.RunPython(
            create_franchise_tables_if_not_exist,
            reverse_franchise_tables,
        ),
    ] 