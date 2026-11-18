import fs from "node:fs";
import path from "node:path";
import { randomBytes, scryptSync } from "node:crypto";
import { createClient, type Client } from "@libsql/client";

const isTursoConfigured = Boolean(
  process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN
);

const localDbPath = process.env.LOCAL_SQLITE_PATH || "/tmp/pavagada-one.db";

const rawClient: Client = isTursoConfigured
  ? createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    })
  : createClient({
      url: `file:${localDbPath}`,
    });

function hashSeedPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

let initPromise: Promise<void> | null = null;

async function ensureInitialized(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      if (!isTursoConfigured) {
        await rawClient.execute(
          "CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"
        );

        const migrationsDir = path.join(process.cwd(), "supabase", "migrations");
        if (fs.existsSync(migrationsDir)) {
          const files = fs
            .readdirSync(migrationsDir)
            .filter((f) => f.endsWith(".sql"))
            .sort();

          for (const file of files) {
            const applied = await rawClient.execute({
              sql: "SELECT 1 FROM _migrations WHERE name = ?",
              args: [file],
            });
            if (applied.rows.length > 0) continue;

            const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
            await rawClient.executeMultiple(sql);
            await rawClient.execute({
              sql: "INSERT INTO _migrations (name) VALUES (?)",
              args: [file],
            });
          }
        }
      }

      await rawClient.execute(
        "CREATE TABLE IF NOT EXISTS _seeds (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"
      );

      const seeded = await rawClient.execute({
        sql: "SELECT 1 FROM _seeds WHERE name = ?",
        args: ["v2_demo_auth_sync"],
      });

      if (seeded.rows.length === 0) {
        const customerHash = hashSeedPassword("Customer@1234");
        const merchantHash = hashSeedPassword("Merchant@1234");
        const riderHash = hashSeedPassword("Rider@1234");
        const adminHash = hashSeedPassword("Admin@1234");

        await rawClient.execute({
          sql: `INSERT OR IGNORE INTO users (id, email, full_name, phone, role, is_active, password_hash, rider_available)
                VALUES (?, ?, ?, ?, 'customer', 1, ?, 0)`,
          args: [
            "demo-customer-001",
            "customer@pavagadaone.local",
            "Ananya Rao",
            "9845011223",
            customerHash,
          ],
        });

        await rawClient.execute({
          sql: `INSERT OR IGNORE INTO users (id, email, full_name, phone, role, is_active, password_hash, rider_available)
                VALUES (?, ?, ?, ?, 'merchant', 1, ?, 0)`,
          args: [
            "demo-merchant-001",
            "merchant@pavagadaone.local",
            "Sri Lakshmi Stores",
            "9000000001",
            merchantHash,
          ],
        });

        await rawClient.execute({
          sql: `INSERT OR IGNORE INTO users (id, email, full_name, phone, role, is_active, password_hash, rider_available)
                VALUES (?, ?, ?, ?, 'rider', 1, ?, 1)`,
          args: [
            "demo-rider-001",
            "rider@pavagadaone.local",
            "Kiran Gowda",
            "9845099887",
            riderHash,
          ],
        });

        await rawClient.execute({
          sql: `UPDATE users SET password_hash = COALESCE(NULLIF(password_hash, ''), ?) WHERE email = 'merchant@pavagadaone.local'`,
          args: [merchantHash],
        });

        await rawClient.execute({
          sql: `UPDATE users SET password_hash = COALESCE(NULLIF(password_hash, ''), ?) WHERE email = 'customer@pavagadaone.local'`,
          args: [customerHash],
        });

        await rawClient.execute({
          sql: `UPDATE users SET password_hash = COALESCE(NULLIF(password_hash, ''), ?) WHERE email = 'rider@pavagadaone.local'`,
          args: [riderHash],
        });

        await rawClient.execute({
          sql: `UPDATE users SET password_hash = COALESCE(NULLIF(password_hash, ''), ?) WHERE email = 'admin@pavagadaone.local'`,
          args: [adminHash],
        });

        await rawClient.execute({
          sql: `INSERT OR IGNORE INTO addresses (id, user_id, label, address_line, landmark, is_default)
                VALUES (?, ?, ?, ?, ?, 1)`,
          args: [
            "550e8400-e29b-41d4-a716-446655440001",
            "demo-customer-001",
            "Home",
            "12, Temple Street, Pavagada Town, Karnataka 561202",
            "Near Sri Lakshmi Narasimha Temple",
          ],
        });

        await rawClient.execute(
          `UPDATE shops SET image_url = COALESCE(image_url, '/images/hero-market.jpg'), opening_hours = COALESCE(opening_hours, '7:00 AM – 9:30 PM') WHERE id = 'shop-lakshmi'`
        );
        await rawClient.execute(
          `UPDATE products SET image_url = COALESCE(image_url, '/images/product-atta.jpg'), unit = COALESCE(unit, '5 kg') WHERE id = 'prod-atta'`
        );
        await rawClient.execute(
          `UPDATE products SET image_url = COALESCE(image_url, '/images/product-tomatoes.jpg'), unit = COALESCE(unit, '1 kg') WHERE id = 'prod-tomato'`
        );
        await rawClient.execute(
          `UPDATE products SET image_url = COALESCE(image_url, '/images/product-milk.jpg'), unit = COALESCE(unit, '500 ml') WHERE id = 'prod-milk'`
        );
        await rawClient.execute(
          `UPDATE products SET unit = COALESCE(unit, '125 g') WHERE id = 'prod-soap'`
        );

        await rawClient.execute(
          `INSERT OR IGNORE INTO coupons (id, code, discount_type, discount_value, active) VALUES ('coupon-pavagada50', 'PAVAGADA50', 'flat', 5000, 1)`
        );
        await rawClient.execute(
          `INSERT OR IGNORE INTO platform_settings (key, value) VALUES ('delivery_fee_paise', '3000'), ('free_delivery_threshold_paise', '50000')`
        );

        await rawClient.execute({
          sql: "INSERT OR IGNORE INTO _seeds (name) VALUES (?)",
          args: ["v2_demo_auth_sync"],
        });
      }

      const shopSync = await rawClient.execute({
        sql: "SELECT 1 FROM _seeds WHERE name = ?",
        args: ["v3_merchant_shop_sync"],
      });

      if (shopSync.rows.length === 0) {
        await rawClient.execute({
          sql: `INSERT OR IGNORE INTO categories (id, name) VALUES ('cat-grocery','Groceries'),('cat-fresh','Fresh produce'),('cat-dairy','Dairy & eggs'),('cat-home','Home essentials')`,
          args: [],
        });
        await rawClient.execute({
          sql: `INSERT OR IGNORE INTO shops (id, owner_id, name, slug, phone, address, is_open, is_approved)
                VALUES ('shop-lakshmi', 'demo-merchant-001', 'Sri Lakshmi Stores', 'sri-lakshmi-stores', '9000000001', 'Main Road, Pavagada', 1, 1)`,
          args: [],
        });
        await rawClient.execute({
          sql: `UPDATE shops SET owner_id = 'demo-merchant-001'
                WHERE id = 'shop-lakshmi'
                AND NOT EXISTS (SELECT 1 FROM shops WHERE owner_id = 'demo-merchant-001')`,
          args: [],
        });
        await rawClient.execute({
          sql: "INSERT OR IGNORE INTO _seeds (name) VALUES (?)",
          args: ["v3_merchant_shop_sync"],
        });
      }
    })().catch((err) => {
      initPromise = null;
      throw err;
    });
  }
  await initPromise;
}

export const db: Client = rawClient;

export async function query(
  sql: string,
  args: (string | number | null)[] = []
) {
  await ensureInitialized();
  return rawClient.execute({ sql, args });
}

export function requireDb(): Client {
  return new Proxy(rawClient, {
    get(target, prop, receiver) {
      if (prop === "transaction") {
        return async (mode?: "write" | "read" | "deferred") => {
          await ensureInitialized();
          return target.transaction(mode);
        };
      }
      if (prop === "execute") {
        return async (...args: Parameters<Client["execute"]>) => {
          await ensureInitialized();
          return target.execute(...args);
        };
      }
      const value = Reflect.get(target, prop, receiver);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}