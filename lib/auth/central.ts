import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

/**
 * Central authentication for the whole app.
 *
 * A single `users` table in `data/auth.db`, shared by all three portals, backs
 * two things:
 *  - the "Sign up" / "Log in" forms on the central /login page (real
 *    accounts, bcrypt-hashed passwords)
 *  - a signed session cookie that each portal's own auth helper consults so
 *    a logged-in identity carries across /gov, /research and /public.
 *
 * The three portals additionally keep their own pre-existing demo-user
 * concept (a seeded row in each portal's own database) for the "Continue as
 * ... demo user" buttons - this module only supplies the *central* session
 * on top of that, per the assignment's instructions.
 */

export type PortalRole = "GOV" | "RESEARCHER" | "PUBLIC";

export interface CentralUser {
  id: string;
  email: string;
  name: string;
  role: PortalRole;
  createdAt: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const SESSION_COOKIE = "li_session";
const SESSION_SECRET =
  process.env.AUTH_SESSION_SECRET || "dev-only-insecure-session-secret-change-me";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

let _db: Database.Database | null = null;

export function getAuthDatabase(): Database.Database {
  if (_db) return _db;
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const db = new Database(path.join(DATA_DIR, "auth.db"));
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
  `);
  _db = db;
  return db;
}

export function findUserByEmail(email: string): (CentralUser & { passwordHash: string }) | null {
  const db = getAuthDatabase();
  const row = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email.trim().toLowerCase()) as any;
  return row ?? null;
}

export function createUser(input: {
  email: string;
  password: string;
  name: string;
  role: PortalRole;
}): CentralUser {
  const db = getAuthDatabase();
  const email = input.email.trim().toLowerCase();
  const existing = findUserByEmail(email);
  if (existing) throw new Error("An account with that email already exists.");
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const passwordHash = bcrypt.hashSync(input.password, 10);
  db.prepare(
    "INSERT INTO users (id, email, passwordHash, name, role, createdAt) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(id, email, passwordHash, input.name.trim(), input.role, createdAt);
  return { id, email, name: input.name.trim(), role: input.role, createdAt };
}

export function verifyPassword(email: string, password: string): CentralUser | null {
  const user = findUserByEmail(email);
  if (!user) return null;
  if (!bcrypt.compareSync(password, user.passwordHash)) return null;
  const { passwordHash, ...rest } = user;
  return rest;
}

// --- Session cookie (signed, not encrypted - holds no secret data) ---------

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: PortalRole;
  /** "demo" for one of the three Demo login buttons, "account" for a real signup/login. */
  kind: "demo" | "account";
  issuedAt: number;
}

function sign(value: string): string {
  return crypto.createHmac("sha256", SESSION_SECRET).update(value).digest("base64url");
}

export function encodeSession(payload: SessionPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function decodeSession(cookieValue: string | undefined | null): SessionPayload | null {
  if (!cookieValue) return null;
  const [body, sig] = cookieValue.split(".");
  if (!body || !sig) return null;
  if (sig !== sign(body)) return null;
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf-8")) as SessionPayload;
  } catch {
    return null;
  }
}

/** Reads the central session from the request cookie jar (server components, route handlers). */
export function getSession(): SessionPayload | null {
  try {
    const raw = cookies().get(SESSION_COOKIE)?.value;
    return decodeSession(raw);
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
export const SESSION_MAX_AGE = SESSION_MAX_AGE_SECONDS;

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

/** Fixed demo identities used by the three "Continue as ... demo user" buttons. */
export const DEMO_IDENTITIES: Record<
  "gov" | "research" | "public",
  { email: string; name: string; role: PortalRole }
> = {
  gov: { email: "policy.user@dolr.gov.in", name: "Demo Government User", role: "GOV" },
  research: { email: "dr.sharma@academic.edu", name: "Dr. Rajesh Sharma", role: "RESEARCHER" },
  public: { email: "citizen.demo@bhumikosh.in", name: "Demo Citizen", role: "PUBLIC" },
};

export function portalForRole(role: PortalRole): "gov" | "research" | "public" {
  if (role === "GOV") return "gov";
  if (role === "RESEARCHER") return "research";
  return "public";
}
