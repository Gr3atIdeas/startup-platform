from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0038_create_specialists"),
    ]

    operations = [
        migrations.RunSQL(
            sql=r"""
            DO $$
            BEGIN
                -- Ensure missing columns exist before adding FKs
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='specialist_votes' AND column_name='specialist_id'
                ) THEN
                    EXECUTE 'ALTER TABLE specialist_votes ADD COLUMN specialist_id INTEGER NULL';
                END IF;

                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='specialist_comments' AND column_name='specialist_id'
                ) THEN
                    EXECUTE 'ALTER TABLE specialist_comments ADD COLUMN specialist_id INTEGER NOT NULL';
                END IF;

                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='specialist_comments' AND column_name='parent_comment_id'
                ) THEN
                    EXECUTE 'ALTER TABLE specialist_comments ADD COLUMN parent_comment_id INTEGER NULL';
                END IF;

                IF EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='specialist_votes' AND column_name='user_id'
                ) THEN
                    BEGIN
                        ALTER TABLE specialist_votes
                        ADD CONSTRAINT specialist_votes_user_fk
                        FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE;
                    EXCEPTION WHEN duplicate_object THEN
                        NULL;
                    END;
                END IF;

                IF EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='specialist_votes' AND column_name='specialist_id'
                ) AND EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='specialists' AND column_name='specialist_id'
                ) THEN
                    BEGIN
                        ALTER TABLE specialist_votes
                        ADD CONSTRAINT specialist_votes_specialist_fk
                        FOREIGN KEY (specialist_id) REFERENCES specialists (specialist_id) ON DELETE CASCADE;
                    EXCEPTION WHEN duplicate_object THEN
                        NULL;
                    END;
                END IF;

                IF EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='specialist_comments' AND column_name='specialist_id'
                ) AND EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='specialists' AND column_name='specialist_id'
                ) THEN
                    BEGIN
                        ALTER TABLE specialist_comments
                        ADD CONSTRAINT specialist_comments_specialist_fk
                        FOREIGN KEY (specialist_id) REFERENCES specialists (specialist_id) ON DELETE CASCADE;
                    EXCEPTION WHEN duplicate_object THEN
                        NULL;
                    END;
                END IF;

                IF EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='specialist_comments' AND column_name='user_id'
                ) THEN
                    BEGIN
                        ALTER TABLE specialist_comments
                        ADD CONSTRAINT specialist_comments_user_fk
                        FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE;
                    EXCEPTION WHEN duplicate_object THEN
                        NULL;
                    END;
                END IF;

                IF EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='specialist_comments' AND column_name='parent_comment_id'
                ) THEN
                    BEGIN
                        ALTER TABLE specialist_comments
                        ADD CONSTRAINT specialist_comments_parent_fk
                        FOREIGN KEY (parent_comment_id) REFERENCES specialist_comments (comment_id) ON DELETE CASCADE;
                    EXCEPTION WHEN duplicate_object THEN
                        NULL;
                    END;
                END IF;
            END$$;
            """,
            reverse_sql="",
        )
    ]


