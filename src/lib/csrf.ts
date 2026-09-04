import { cookies } from "next/headers";

const COOKIE_NAME = "csrf_signature";
const MAX_AGE = 3600;

function getSecret(): string {
  const secret = process.env.CSRF_SECRET;
  if (!secret) {
    throw new Error("CSRF_SECRET environment variable is required");
  }
  return secret;
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (b) =>
    b.toString(16).padStart(2, "0")
  ).join("");
}

async function hmacSign(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return toHex(signature);
}

function generateRandomToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return toHex(array.buffer);
}

export async function generateCsrfToken(): Promise<string> {
  const token = generateRandomToken();
  const secret = getSecret();
  const signature = await hmacSign(token, secret);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, signature, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: MAX_AGE,
  });

  return token;
}

export async function validateCsrfToken(token: string | null): Promise<boolean> {
  if (!token) return false;

  const cookieStore = await cookies();
  const storedSignature = cookieStore.get(COOKIE_NAME)?.value;
  if (!storedSignature) return false;

  const secret = getSecret();
  const expectedSignature = await hmacSign(token, secret);

  if (expectedSignature !== storedSignature) return false;

  // Timing-safe comparison
  if (expectedSignature.length !== storedSignature.length) return false;
  let result = 0;
  for (let i = 0; i < expectedSignature.length; i++) {
    result |= expectedSignature.charCodeAt(i) ^ storedSignature.charCodeAt(i);
  }
  return result === 0;
}
