-- Shared trigger function for maintaining updated_at on write.
-- Reused by any table that has an updated_at column.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE calculators (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    config         JSONB       NOT NULL DEFAULT '{}',
    config_version INTEGER     NOT NULL DEFAULT 1,
    is_deleted     BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Support fast lookup of a user's active calculators.
CREATE INDEX calculators_user_id_idx ON calculators (user_id)
    WHERE is_deleted = FALSE;

CREATE TRIGGER calculators_set_updated_at
    BEFORE UPDATE ON calculators
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
