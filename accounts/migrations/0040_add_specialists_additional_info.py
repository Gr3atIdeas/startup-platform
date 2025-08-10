from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0039_add_fk_to_specialist_tables"),
    ]

    operations = [
        migrations.RunSQL(
            sql="ALTER TABLE IF EXISTS specialists ADD COLUMN IF NOT EXISTS additional_info TEXT NULL;",
            reverse_sql="",
        )
    ]


