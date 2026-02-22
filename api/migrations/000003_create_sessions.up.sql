CREATE TABLE sessions (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- token_hash stores a SHA-256 hex digest of the bearer token.
    -- The plain token is never stored; only the hash is persisted.
    token_hash     TEXT        NOT NULL UNIQUE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at     TIMESTAMPTZ NOT NULL,
    -- NULL while the session is active; set to NOW() on logout.
    invalidated_at TIMESTAMPTZ
);

-- Support fast lookup of all active sessions for a given user
-- (e.g., to invalidate all sessions on password change).
CREATE INDEX sessions_user_id_idx ON sessions (user_id)
    WHERE invalidated_at IS NULL;
