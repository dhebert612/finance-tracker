-- 000017_create_transaction_categories.up.sql

CREATE TABLE transaction_categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id   UUID REFERENCES families(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    color       TEXT,
    icon        TEXT,
    is_default  BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transaction_categories_family_id ON transaction_categories(family_id);

-- Seed default categories available to all users (family_id NULL = global defaults)
INSERT INTO transaction_categories (name, color, icon, is_default) VALUES
    ('Groceries',       '#4CAF50', '🛒', true),
    ('Dining',          '#FF9800', '🍽️', true),
    ('Transport',       '#2196F3', '🚗', true),
    ('Housing',         '#9C27B0', '🏠', true),
    ('Utilities',       '#607D8B', '💡', true),
    ('Healthcare',      '#F44336', '🏥', true),
    ('Entertainment',   '#E91E63', '🎬', true),
    ('Shopping',        '#FF5722', '🛍️', true),
    ('Subscriptions',   '#00BCD4', '📱', true),
    ('Travel',          '#009688', '✈️', true),
    ('Education',       '#3F51B5', '📚', true),
    ('Income',          '#8BC34A', '💰', true),
    ('Transfer',        '#795548', '🔄', true),
    ('Other',           '#9E9E9E', '📦', true);
