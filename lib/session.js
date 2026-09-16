import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const COOKIE_NAME = "family_circle_session";
const SEVEN_DAYS = 60 * 60 * 24 * 7;

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET environment variable is not set. Add it in your Vercel project settings."
    );
  }
  return secret;
}

export function createSessionToken(user) {
  return jwt.sign(
    { userId: user.id, username: user.username, displayName: user.display_name },
    getSecret(),
    { expiresIn: SEVEN_DAYS }
  );
}

export function setSessionCookie(token) {
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SEVEN_DAYS,
  });
}

export function clearSessionCookie() {
  cookies().set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
}

// Returns { userId, username, displayName } or null if not logged in / invalid token.
export function getSession() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, getSecret());
  } catch {
    return null;
  }
}
