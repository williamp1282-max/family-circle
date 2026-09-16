import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql, ensureSchema } from "../../../../lib/db";
import { createSessionToken, setSessionCookie } from "../../../../lib/session";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required." }, { status: 400 });
    }

    await ensureSchema();

    const cleanUsername = username.trim().toLowerCase();
    const result = await sql`SELECT id, username, display_name, password_hash FROM users WHERE username = ${cleanUsername}`;
    const user = result.rows[0];

    if (!user) {
      return NextResponse.json({ error: "Incorrect username or password." }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Incorrect username or password." }, { status: 401 });
    }

    const token = createSessionToken(user);
    setSessionCookie(token);

    return NextResponse.json({ ok: true, user: { username: user.username, displayName: user.display_name } });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
