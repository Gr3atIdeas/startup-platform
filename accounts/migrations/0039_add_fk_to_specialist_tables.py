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
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='specialist_votes' AND column_name='user_id'
                ) THEN
                    ALTER TABLE specialist_votes
                    ADD CONSTRAINT IF NOT EXISTS specialist_votes_user_fk
                    FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE;
                END IF;

                IF EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='specialist_votes' AND column_name='specialist_id'
                ) THEN
                    ALTER TABLE specialist_votes
                    ADD CONSTRAINT IF NOT EXISTS specialist_votes_specialist_fk
                    FOREIGN KEY (specialist_id) REFERENCES specialists (specialist_id) ON DELETE CASCADE;
                END IF;

                IF EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='specialist_comments' AND column_name='specialist_id'
                ) THEN
                    ALTER TABLE specialist_comments
                    ADD CONSTRAINT IF NOT EXISTS specialist_comments_specialist_fk
                    FOREIGN KEY (specialist_id) REFERENCES specialists (specialist_id) ON DELETE CASCADE;
                END IF;

                IF EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='specialist_comments' AND column_name='user_id'
                ) THEN
                    ALTER TABLE specialist_comments
                    ADD CONSTRAINT IF NOT EXISTS specialist_comments_user_fk
                    FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE;
                END IF;

                IF EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='specialist_comments' AND column_name='parent_comment_id'
                ) THEN
                    ALTER TABLE specialist_comments
                    ADD CONSTRAINT IF NOT EXISTS specialist_comments_parent_fk
                    FOREIGN KEY (parent_comment_id) REFERENCES specialist_comments (comment_id) ON DELETE CASCADE;
                END IF;
            END$$;
            """,
            reverse_sql="",
        )
    ]


