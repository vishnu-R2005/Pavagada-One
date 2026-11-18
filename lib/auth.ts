import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";

export type Role = "customer" | "merchant" | "admin" | "rider";
export type User = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  isActive: boolean;
};

const COOKIE = "pavagada_session";
const FALLBACK_SECRET =
  "pavagada-one-dev-session-secret-change-in-production-32chars";

function secret() {
  const value = process.env.AUTH_SECRET;
  return value && value.length >= 32 ? value : FALLBACK_SECRET;
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  return timingSafeEqual(
    Buffer.from(hash, "hex"),
    scryptSync(password, salt, 64)
  );
}

function encode(data: object) {
  const body = Buffer.from(JSON.stringify(data)).toString("base64url");
  const sig = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function decode(value: string) {
  const [body, sig] = value.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", secret())
    .update(body)
    .digest("base64url");
  if (sig.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const d = JSON.parse(Buffer.from(body, "base64url").toString()) as {
      id: string;
      role: Role;
      exp: number;
    };
    return d.exp > Date.now() ? d : null;
  } catch {
    return null;
  }
}

async function isHttpsRequest(): Promise<boolean> {
  const hdrs = await headers();
  const proto = hdrs.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const origin = hdrs.get("origin") || hdrs.get("referer") || "";
  return (
    proto === "https" ||
    origin.startsWith("https://")
  );
}

export function createSessionToken(user: User): string {
  return encode({
    id: user.id,
    role: user.role,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
  });
}

export async function setSession(user: User): Promise<string> {
  const jar = await cookies();
  const isHttps = await isHttpsRequest();
  const token = createSessionToken(user);

  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: isHttps,
    sameSite: isHttps ? "none" : "lax",
    ...(isHttps ? { partitioned: true } : {}),
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return token;
}

export async function clearSession() {
  const jar = await cookies();
  const isHttps = await isHttpsRequest();
  jar.set(COOKIE, "", {
    httpOnly: true,
    secure: isHttps,
    sameSite: isHttps ? "none" : "lax",
    ...(isHttps ? { partitioned: true } : {}),
    path: "/",
    maxAge: 0,
  });
}

export async function currentUser(): Promise<User | null> {
  const jar = await cookies();
  const hdrs = await headers();

  const authHeader = hdrs.get("authorization") || "";
  const bearerToken = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : "";
  const headerToken = hdrs.get("x-pavagada-session")?.trim() || "";
  const cookieToken = jar.get(COOKIE)?.value || "";

  const candidates = [bearerToken, headerToken, cookieToken].filter(Boolean);
  let verified: { id: string; role: Role; exp: number } | null = null;
  for (const token of candidates) {
    verified = decode(token);
    if (verified) break;
  }

  if (!verified) return null;

  const r = await query(
    "select id,email,full_name,role,is_active from users where id=?",
    [verified.id]
  );
  const u = r.rows[0] as Record<string, unknown> | undefined;
  if (!u || !u.is_active) return null;

  return {
    id: String(u.id),
    email: String(u.email),
    fullName: String(u.full_name),
    role: u.role as Role,
    isActive: Boolean(u.is_active),
  };
}

export async function requireRole(...roles: Role[]) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  if (!roles.includes(user.role)) redirect(`/${user.role}`);
  return user;
}

export async function audit(
  actor: string,
  action: string,
  type: string,
  id?: string
) {
  await query(
    "insert into audit_logs (id,actor_id,action,entity_type,entity_id) values (?,?,?,?,?)",
    [crypto.randomUUID(), actor, action, type, id ?? null]
  );
}