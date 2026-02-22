CREATE TABLE users (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    email          TEXT        NOT NULL UNIQUE,
    password_hash  TEXT,
    oauth_provider TEXT,
    oauth_id       TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prevent duplicate OAuth identities.
CREATE UNIQUE INDEX users_oauth_idx ON users (oauth_provider, oauth_id)
    WHERE oauth_provider IS NOT NULL AND oauth_id IS NOT NULL;
