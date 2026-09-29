import { NextRequest, NextResponse } from "next/server";

// Middleware runs on the Edge runtime, which has no Node `crypto` module -
// use Web Crypto (available there) to verify the same HMAC signature that
// lib/auth/central.ts produces with Node's crypto.

const SESSION_COOKIE = "li_session";
const SESSION_SECRET =
  process.env.AUTH_SESSION_SECRET || "dev-only-insecure-session-secret-change-me";

function base64UrlToBytes(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function bytesToBase64Url(bytes: ArrayBuffer): string {
  const binary = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sign(value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return bytesToBase64Url(sig);
}

async function hasValidSession(cookieValue: string | undefined): Promise<boolean> {
  if (!cookieValue) return false;
  const [body, sig] = cookieValue.split(".");
  if (!body || !sig) return false;
  return (await sign(body)) === sig;
}

/**
 * Gate the three portals behind the central login. Anyone hitting /gov,
 * /research or /public without a valid central session cookie is bounced to
 * /login first.
 */
export async function middleware(req: NextRequest) {
  const session = req.cookies.get(SESSION_COOKIE)?.value;
  if (await hasValidSession(session)) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/gov/:path*", "/research/:path*", "/public/:path*"],
};
