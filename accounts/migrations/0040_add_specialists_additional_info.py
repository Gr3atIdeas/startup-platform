from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0039_add_fk_to_specialist_tables"),
    ]

    operations = [
        migrations.RunSQL(
            sql=r"""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name='specialists' AND column_name='startup_id'
                ) THEN
                    ALTER TABLE specialists ADD COLUMN startup_id integer;
                    CREATE SEQUENCE IF NOT EXISTS specialists_startup_id_seq;
                    ALTER SEQUENCE specialists_startup_id_seq OWNED BY specialists.startup_id;
                    ALTER TABLE specialists ALTER COLUMN startup_id SET DEFAULT nextval('specialists_startup_id_seq');
                    UPDATE specialists SET startup_id = nextval('specialists_startup_id_seq') WHERE startup_id IS NULL;
                END IF;

                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name='specialists' AND column_name='additional_info'
                ) THEN
                    ALTER TABLE specialists ADD COLUMN additional_info TEXT NULL;
                END IF;
            END$$;
            """,
            reverse_sql="",
        )
    ]


