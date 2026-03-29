-- Analytics Overhaul: impressions, engagement, geography, sources
-- Run BEFORE deploying the new code

-- 1. Catalog impressions (IntersectionObserver tracks card visibility)
CREATE TABLE IF NOT EXISTS analytics_catalog_impressions (
    impression_id BIGSERIAL PRIMARY KEY,
    entity_type VARCHAR(20) NOT NULL,
    entity_id INTEGER NOT NULL,
    visitor_hash VARCHAR(64) NOT NULL,
    ip_address INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_impressions_entity
    ON analytics_catalog_impressions (entity_type, entity_id, created_at);
CREATE INDEX IF NOT EXISTS idx_impressions_dedup
    ON analytics_catalog_impressions (entity_type, entity_id, visitor_hash, created_at);

-- 2. Engagement events (time on page + scroll depth)
CREATE TABLE IF NOT EXISTS analytics_engagement_events (
    engagement_id BIGSERIAL PRIMARY KEY,
    entity_type VARCHAR(20) NOT NULL,
    entity_id INTEGER NOT NULL,
    visitor_hash VARCHAR(64) NOT NULL,
    time_on_page INTEGER NOT NULL DEFAULT 0,
    scroll_depth INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_engagement_entity
    ON analytics_engagement_events (entity_type, entity_id, created_at);

-- 3. GeoIP cache (resolved IP -> country/city)
CREATE TABLE IF NOT EXISTS analytics_geo_cache (
    ip_address INET PRIMARY KEY,
    country_code VARCHAR(2),
    country_name VARCHAR(100),
    city VARCHAR(200),
    resolved_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Daily geography breakdown
CREATE TABLE IF NOT EXISTS analytics_daily_geo (
    id BIGSERIAL PRIMARY KEY,
    entity_type VARCHAR(20) NOT NULL,
    entity_id INTEGER NOT NULL,
    stat_date DATE NOT NULL,
    country_code VARCHAR(2) NOT NULL,
    country_name VARCHAR(100) NOT NULL DEFAULT '',
    view_count INTEGER NOT NULL DEFAULT 0,
    UNIQUE (entity_type, entity_id, stat_date, country_code)
);

-- 5. Extend daily stats with new columns
ALTER TABLE analytics_daily_stats
    ADD COLUMN IF NOT EXISTS impressions INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS unique_impressions INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS avg_time_on_page INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS avg_scroll_depth INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS engagement_count INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS source_direct INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS source_search INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS source_social INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS source_internal INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS source_other INTEGER NOT NULL DEFAULT 0;
