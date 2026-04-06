-- Add content_type column to news_articles (news vs article)
-- Also add entity_focus for filtering by franchise/startup/etc
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'news_articles' AND column_name = 'content_type'
    ) THEN
        ALTER TABLE news_articles ADD COLUMN content_type VARCHAR(20) DEFAULT 'news';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'news_articles' AND column_name = 'entity_focus'
    ) THEN
        ALTER TABLE news_articles ADD COLUMN entity_focus VARCHAR(20) DEFAULT '';
    END IF;

    -- Set existing articles to 'news' type
    UPDATE news_articles SET content_type = 'news' WHERE content_type IS NULL;
END $$;
