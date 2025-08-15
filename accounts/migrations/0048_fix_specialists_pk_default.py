from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0047_merge_fix_agency_and_specialist"),
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
                    EXECUTE 'ALTER TABLE specialists ADD COLUMN startup_id integer';
                END IF;

                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.sequences 
                    WHERE sequence_name='specialists_startup_id_seq'
                ) THEN
                    EXECUTE 'CREATE SEQUENCE specialists_startup_id_seq';
                END IF;

                EXECUTE 'ALTER SEQUENCE specialists_startup_id_seq OWNED BY specialists.startup_id';

                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='specialists' AND column_name='startup_id' 
                    AND column_default LIKE 'nextval(%'
                ) THEN
                    EXECUTE 'ALTER TABLE specialists ALTER COLUMN startup_id SET DEFAULT nextval(''specialists_startup_id_seq'')';
                END IF;

                EXECUTE 'UPDATE specialists SET startup_id = nextval(''specialists_startup_id_seq'') WHERE startup_id IS NULL';
            END$$;
            """,
            reverse_sql="",
        )
    ]


