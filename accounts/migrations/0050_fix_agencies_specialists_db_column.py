from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0049_fix_specialists_pk_default"),
    ]

    operations = [
        migrations.RunSQL(
            sql=r"""
            DO $$
            BEGIN
                -- Переименовываем колонку startup_id в agencies в agency_id
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='agencies' AND column_name='startup_id'
                ) THEN
                    EXECUTE 'ALTER TABLE agencies RENAME COLUMN startup_id TO agency_id';
                END IF;

                -- Переименовываем колонку startup_id в specialists в specialist_id
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='specialists' AND column_name='startup_id'
                ) THEN
                    EXECUTE 'ALTER TABLE specialists RENAME COLUMN startup_id TO specialist_id';
                END IF;

                -- Переименовываем последовательности
                IF EXISTS (
                    SELECT 1 FROM information_schema.sequences 
                    WHERE sequence_name='agencies_startup_id_seq'
                ) THEN
                    EXECUTE 'ALTER SEQUENCE agencies_startup_id_seq RENAME TO agencies_agency_id_seq';
                END IF;

                IF EXISTS (
                    SELECT 1 FROM information_schema.sequences 
                    WHERE sequence_name='specialists_startup_id_seq'
                ) THEN
                    EXECUTE 'ALTER SEQUENCE specialists_startup_id_seq RENAME TO specialists_specialist_id_seq';
                END IF;

                -- Обновляем владельца последовательностей
                IF EXISTS (
                    SELECT 1 FROM information_schema.sequences 
                    WHERE sequence_name='agencies_agency_id_seq'
                ) THEN
                    EXECUTE 'ALTER SEQUENCE agencies_agency_id_seq OWNED BY agencies.agency_id';
                END IF;

                IF EXISTS (
                    SELECT 1 FROM information_schema.sequences 
                    WHERE sequence_name='specialists_specialist_id_seq'
                ) THEN
                    EXECUTE 'ALTER SEQUENCE specialists_specialist_id_seq OWNED BY specialists.specialist_id';
                END IF;
            END$$;
            """,
            reverse_sql=r"""
            DO $$
            BEGIN
                -- Обратное переименование
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='agencies' AND column_name='agency_id'
                ) THEN
                    EXECUTE 'ALTER TABLE agencies RENAME COLUMN agency_id TO startup_id';
                END IF;

                IF EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='specialists' AND column_name='specialist_id'
                ) THEN
                    EXECUTE 'ALTER TABLE specialists RENAME COLUMN specialist_id TO startup_id';
                END IF;
            END$$;
            """,
        )
    ]

