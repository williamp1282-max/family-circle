import { NextResponse } from "next/server";
import { sql, ensureSchema } from "../../../../lib/db";
import { getSession } from "../../../../lib/session";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { inviteCode } = await request.json();
  if (!inviteCode || !inviteCode.trim()) {
    return NextResponse.json({ error: "Invite code is required." }, { status: 400 });
  }

  await ensureSchema();

  const cleanCode = inviteCode.trim().toUpperCase();
  const familyResult = await sql`SELECT id, name FROM families WHERE invite_code = ${cleanCode}`;
  const family = familyResult.rows[0];

  if (!family) {
    return NextResponse.json({ error: "No family found with that invite code." }, { status: 404 });
  }

  const existing = await sql`
    SELECT 1 FROM family_members WHERE family_id = ${family.id} AND user_id = ${session.userId}
  `;
  if (existing.rows.length > 0) {
    return NextResponse.json({ ok: true, family, alreadyMember: true });
  }

  await sql`
    INSERT INTO family_members (family_id, user_id, role)
    VALUES (${family.id}, ${session.userId}, 'member')
  `;

  return NextResponse.json({ ok: true, family });
}
