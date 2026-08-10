import type { User } from "@/domain/entities";
import { demoWorkspace } from "@/lib/mock-data";

export const authSessionCookieName = "growth_engine_session";

export type AuthSession = {
  workspaceId: string;
  userId: string;
  ownerUserId: string;
  role: User["role"];
  status: User["status"];
  issuedAt: number;
  expiresAt: number;
};

const sessionTtlSeconds = 60 * 60 * 8;
const encoder = new TextEncoder();

function getAuthSecret() {
  return process.env.GROWTH_ENGINE_AUTH_SECRET ?? null;
}

function base64UrlEncode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

async function signPayload(payload: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));

  return Buffer.from(signature).toString("base64url");
}

export function isProductionAuthConfigured() {
  return Boolean(
    process.env.GROWTH_ENGINE_AUTH_SECRET &&
      process.env.GROWTH_ENGINE_OWNER_ACCESS_CODE
  );
}

export function isValidOwnerAccessCode(accessCode: string) {
  const expectedAccessCode = process.env.GROWTH_ENGINE_OWNER_ACCESS_CODE;

  return Boolean(expectedAccessCode && accessCode === expectedAccessCode);
}

export async function createOwnerSessionToken() {
  const secret = getAuthSecret();

  if (!secret) {
    throw new Error("Production auth provider is not configured.");
  }

  const now = Math.floor(Date.now() / 1000);
  const session: AuthSession = {
    workspaceId: demoWorkspace.id,
    userId: demoWorkspace.ownerUserId,
    ownerUserId: demoWorkspace.ownerUserId,
    role: "owner",
    status: "active",
    issuedAt: now,
    expiresAt: now + sessionTtlSeconds
  };
  const payload = base64UrlEncode(JSON.stringify(session));
  const signature = await signPayload(payload, secret);

  return `${payload}.${signature}`;
}

export async function verifySessionToken(token: string | undefined | null) {
  const secret = getAuthSecret();

  if (!secret || !token) {
    return null;
  }

  const [payload, signature] = token.split(".");

  if (!payload || !signature) {
    return null;
  }

  const expectedSignature = await signPayload(payload, secret);

  if (signature !== expectedSignature) {
    return null;
  }

  try {
    const session = JSON.parse(base64UrlDecode(payload)) as Partial<AuthSession>;
    const now = Math.floor(Date.now() / 1000);

    if (
      session.workspaceId !== demoWorkspace.id ||
      session.userId !== demoWorkspace.ownerUserId ||
      session.ownerUserId !== demoWorkspace.ownerUserId ||
      session.role !== "owner" ||
      session.status !== "active" ||
      typeof session.expiresAt !== "number" ||
      session.expiresAt <= now
    ) {
      return null;
    }

    return session as AuthSession;
  } catch {
    return null;
  }
}

export function getCookieValue(request: Request | undefined, cookieName: string) {
  const cookieHeader = request?.headers.get("cookie");

  if (!cookieHeader) {
    return null;
  }

  return (
    cookieHeader
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${cookieName}=`))
      ?.slice(cookieName.length + 1) ?? null
  );
}
