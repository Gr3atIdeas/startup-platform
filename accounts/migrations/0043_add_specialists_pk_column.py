from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0042_merge_specialists_branch"),
    ]

    operations = [
        migrations.RunSQL(
            sql=r"""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name='specialists' AND column_name='specialist_id'
                ) THEN
                    ALTER TABLE specialists ADD COLUMN specialist_id integer;
                    CREATE SEQUENCE IF NOT EXISTS specialists_specialist_id_seq;
                    ALTER SEQUENCE specialists_specialist_id_seq OWNED BY specialists.specialist_id;
                    ALTER TABLE specialists ALTER COLUMN specialist_id SET DEFAULT nextval('specialists_specialist_id_seq');
                    UPDATE specialists SET specialist_id = nextval('specialists_specialist_id_seq') WHERE specialist_id IS NULL;
                END IF;
            END$$;
            """,
            reverse_sql="",
        )
    ]


