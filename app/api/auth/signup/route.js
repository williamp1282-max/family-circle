import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql, ensureSchema } from "../../../../lib/db";
import { createSessionToken, setSessionCookie } from "../../../../lib/session";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const { username, displayName, password } = await request.json();

    if (!username || !displayName || !password) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }
    const cleanUsername = username.trim().toLowerCase();
    if (!/^[a-z0-9._-]{3,30}$/.test(cleanUsername)) {
      return NextResponse.json(
        { error: "Username must be 3-30 characters: letters, numbers, dots, dashes, underscores." },
        { status: 400 }
      );
    }

    await ensureSchema();

    const existing = await sql`SELECT id FROM users WHERE username = ${cleanUsername}`;
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await sql`
      INSERT INTO users (username, display_name, password_hash)
      VALUES (${cleanUsername}, ${displayName.trim()}, ${passwordHash})
      RETURNING id, username, display_name
    `;
    const user = result.rows[0];

    const token = createSessionToken(user);
    setSessionCookie(token);

    return NextResponse.json({ ok: true, user: { username: user.username, displayName: user.display_name } });
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
