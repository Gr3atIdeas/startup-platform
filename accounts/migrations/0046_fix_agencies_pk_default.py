from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0045_state_sync_specialists"),
    ]

    operations = [
        migrations.RunSQL(
            sql=r"""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='agencies' AND column_name='startup_id'
                ) THEN
                    EXECUTE 'ALTER TABLE agencies ADD COLUMN startup_id integer';
                END IF;

                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.sequences 
                    WHERE sequence_name='agencies_startup_id_seq'
                ) THEN
                    EXECUTE 'CREATE SEQUENCE agencies_startup_id_seq';
                END IF;

                EXECUTE 'ALTER SEQUENCE agencies_startup_id_seq OWNED BY agencies.startup_id';

                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='agencies' AND column_name='startup_id' 
                    AND column_default LIKE 'nextval(%'
                ) THEN
                    EXECUTE 'ALTER TABLE agencies ALTER COLUMN startup_id SET DEFAULT nextval(''agencies_startup_id_seq'')';
                END IF;

                EXECUTE 'UPDATE agencies SET startup_id = nextval(''agencies_startup_id_seq'') WHERE startup_id IS NULL';
            END$$;
            """,
            reverse_sql="",
        )
    ]


