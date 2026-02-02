"""
Миграция для добавления индексов производительности.

Для managed=True моделей — через Django ORM.
Для managed=False моделей — через RunSQL (CREATE INDEX IF NOT EXISTS).
"""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0062_merge_migrations"),
    ]

    operations = [
        # =============================================
        # 1. Managed модели — Django ORM индексы
        # =============================================

        # Startups
        migrations.AddIndex(
            model_name="startups",
            index=models.Index(
                fields=["status", "-created_at"],
                name="idx_startups_status_created",
            ),
        ),
        migrations.AddIndex(
            model_name="startups",
            index=models.Index(
                fields=["owner", "status"],
                name="idx_startups_owner_status",
            ),
        ),
        migrations.AddIndex(
            model_name="startups",
            index=models.Index(
                fields=["status", "direction"],
                name="idx_startups_status_dir",
            ),
        ),

        # Franchises
        migrations.AddIndex(
            model_name="franchises",
            index=models.Index(
                fields=["status", "-created_at"],
                name="idx_franchises_status_created",
            ),
        ),
        migrations.AddIndex(
            model_name="franchises",
            index=models.Index(
                fields=["owner", "status"],
                name="idx_franchises_owner_status",
            ),
        ),
        migrations.AddIndex(
            model_name="franchises",
            index=models.Index(
                fields=["status", "direction"],
                name="idx_franchises_status_dir",
            ),
        ),

        # Agencies
        migrations.AddIndex(
            model_name="agencies",
            index=models.Index(
                fields=["status", "-created_at"],
                name="idx_agencies_status_created",
            ),
        ),
        migrations.AddIndex(
            model_name="agencies",
            index=models.Index(
                fields=["owner", "status"],
                name="idx_agencies_owner_status",
            ),
        ),

        # Specialists
        migrations.AddIndex(
            model_name="specialists",
            index=models.Index(
                fields=["status", "-created_at"],
                name="idx_specialists_status_created",
            ),
        ),
        migrations.AddIndex(
            model_name="specialists",
            index=models.Index(
                fields=["owner", "status"],
                name="idx_specialists_owner_status",
            ),
        ),

        # FranchiseComments
        migrations.AddIndex(
            model_name="franchisecomments",
            index=models.Index(
                fields=["franchise", "parent_comment", "-created_at"],
                name="idx_frcomments_fran_parent",
            ),
        ),

        # SpecialistComments
        migrations.AddIndex(
            model_name="specialistcomments",
            index=models.Index(
                fields=["specialist", "parent_comment", "-created_at"],
                name="idx_spcomments_spec_parent",
            ),
        ),

        # AgencyComments
        migrations.AddIndex(
            model_name="agencycomments",
            index=models.Index(
                fields=["agency", "parent_comment", "-created_at"],
                name="idx_agcomments_agency_parent",
            ),
        ),

        # =============================================
        # 2. Unmanaged модели — RunSQL индексы
        # =============================================

        # Comments (managed=False)
        migrations.RunSQL(
            sql=[
                "CREATE INDEX IF NOT EXISTS idx_comments_startup_parent ON comments (startup_id, parent_comment_id, created_at DESC);",
                "CREATE INDEX IF NOT EXISTS idx_comments_user ON comments (user_id);",
            ],
            reverse_sql=[
                "DROP INDEX IF EXISTS idx_comments_startup_parent;",
                "DROP INDEX IF EXISTS idx_comments_user;",
            ],
        ),

        # InvestmentTransactions (managed=False)
        migrations.RunSQL(
            sql=[
                "CREATE INDEX IF NOT EXISTS idx_invest_tx_investor ON investment_transactions (investor_id);",
                "CREATE INDEX IF NOT EXISTS idx_invest_tx_startup ON investment_transactions (startup_id);",
                "CREATE INDEX IF NOT EXISTS idx_invest_tx_franchise ON investment_transactions (franchise_id);",
                "CREATE INDEX IF NOT EXISTS idx_invest_tx_created ON investment_transactions (created_at DESC);",
                "CREATE INDEX IF NOT EXISTS idx_invest_tx_startup_amount ON investment_transactions (startup_id, amount);",
            ],
            reverse_sql=[
                "DROP INDEX IF EXISTS idx_invest_tx_investor;",
                "DROP INDEX IF EXISTS idx_invest_tx_startup;",
                "DROP INDEX IF EXISTS idx_invest_tx_franchise;",
                "DROP INDEX IF EXISTS idx_invest_tx_created;",
                "DROP INDEX IF EXISTS idx_invest_tx_startup_amount;",
            ],
        ),

        # startup_votes / UserVotes (managed=False)
        migrations.RunSQL(
            sql=[
                "CREATE INDEX IF NOT EXISTS idx_startup_votes_startup ON startup_votes (startup_id);",
                "CREATE INDEX IF NOT EXISTS idx_startup_votes_user ON startup_votes (user_id);",
                "CREATE INDEX IF NOT EXISTS idx_startup_votes_rating ON startup_votes (startup_id, vote_value);",
            ],
            reverse_sql=[
                "DROP INDEX IF EXISTS idx_startup_votes_startup;",
                "DROP INDEX IF EXISTS idx_startup_votes_user;",
                "DROP INDEX IF EXISTS idx_startup_votes_rating;",
            ],
        ),

        # ChatParticipants (managed=False)
        migrations.RunSQL(
            sql=[
                "CREATE INDEX IF NOT EXISTS idx_chat_participants_user ON chat_participants (user_id);",
                "CREATE INDEX IF NOT EXISTS idx_chat_participants_conv_user ON chat_participants (conversation_id, user_id);",
            ],
            reverse_sql=[
                "DROP INDEX IF EXISTS idx_chat_participants_user;",
                "DROP INDEX IF EXISTS idx_chat_participants_conv_user;",
            ],
        ),

        # Messages (managed=False)
        migrations.RunSQL(
            sql=[
                "CREATE INDEX IF NOT EXISTS idx_messages_conv_created ON messages (conversation_id, created_at);",
                "CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages (sender_id);",
            ],
            reverse_sql=[
                "DROP INDEX IF EXISTS idx_messages_conv_created;",
                "DROP INDEX IF EXISTS idx_messages_sender;",
            ],
        ),

        # Notifications (managed=False)
        migrations.RunSQL(
            sql=[
                "CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id, is_read, created_at DESC);",
            ],
            reverse_sql=[
                "DROP INDEX IF EXISTS idx_notifications_user;",
            ],
        ),

        # NewsArticles (managed=False)
        migrations.RunSQL(
            sql=[
                "CREATE INDEX IF NOT EXISTS idx_news_articles_published ON news_articles (published_at DESC);",
            ],
            reverse_sql=[
                "DROP INDEX IF EXISTS idx_news_articles_published;",
            ],
        ),

        # NewsLikes (managed=False)
        migrations.RunSQL(
            sql=[
                "CREATE INDEX IF NOT EXISTS idx_news_likes_article ON news_likes (article_id);",
                "CREATE INDEX IF NOT EXISTS idx_news_likes_article_user ON news_likes (article_id, user_id);",
            ],
            reverse_sql=[
                "DROP INDEX IF EXISTS idx_news_likes_article;",
                "DROP INDEX IF EXISTS idx_news_likes_article_user;",
            ],
        ),

        # NewsViews (managed=False)
        migrations.RunSQL(
            sql=[
                "CREATE INDEX IF NOT EXISTS idx_news_views_article ON news_views (article_id);",
                "CREATE INDEX IF NOT EXISTS idx_news_views_article_user ON news_views (article_id, user_id);",
            ],
            reverse_sql=[
                "DROP INDEX IF EXISTS idx_news_views_article;",
                "DROP INDEX IF EXISTS idx_news_views_article_user;",
            ],
        ),

        # UserInterests (managed=False)
        migrations.RunSQL(
            sql=[
                "CREATE INDEX IF NOT EXISTS idx_user_interests_user ON user_interests (user_id);",
                "CREATE INDEX IF NOT EXISTS idx_user_interests_startup ON user_interests (startup_id);",
            ],
            reverse_sql=[
                "DROP INDEX IF EXISTS idx_user_interests_user;",
                "DROP INDEX IF EXISTS idx_user_interests_startup;",
            ],
        ),

        # ActivityLog (managed=False)
        migrations.RunSQL(
            sql=[
                "CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log (user_id, created_at DESC);",
            ],
            reverse_sql=[
                "DROP INDEX IF EXISTS idx_activity_log_user;",
            ],
        ),
    ]
