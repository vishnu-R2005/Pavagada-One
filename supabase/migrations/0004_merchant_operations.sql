ALTER TABLE shops ADD COLUMN image_url TEXT;
ALTER TABLE shops ADD COLUMN opening_hours TEXT;
ALTER TABLE shops ADD COLUMN delivery_available INTEGER NOT NULL DEFAULT 1;
ALTER TABLE products ADD COLUMN unit TEXT;
CREATE TABLE merchant_applications (id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),shop_name TEXT NOT NULL,phone TEXT NOT NULL,address TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending',admin_note TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,reviewed_at TEXT);