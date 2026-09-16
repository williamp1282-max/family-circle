import { NextResponse } from "next/server";
import { sql, ensureSchema } from "../../../lib/db";
import { getSession } from "../../../lib/session";
import { generateInviteCode } from "../../../lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  await ensureSchema();

  const result = await sql`
    SELECT f.id, f.name, f.invite_code, f.created_by, fm.role,
           (SELECT COUNT(*) FROM family_members WHERE family_id = f.id) AS member_count
    FROM families f
    JOIN family_members fm ON fm.family_id = f.id
    WHERE fm.user_id = ${session.userId}
    ORDER BY f.created_at DESC
  `;
  return NextResponse.json({ families: result.rows });
}

export async function POST(request) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { name } = await request.json();
  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Family name is required." }, { status: 400 });
  }

  await ensureSchema();

  let inviteCode;
  let familyResult;
  for (let attempt = 0; attempt < 5; attempt++) {
    inviteCode = generateInviteCode();
    try {
      familyResult = await sql`
        INSERT INTO families (name, invite_code, created_by)
        VALUES (${name.trim()}, ${inviteCode}, ${session.userId})
        RETURNING id, name, invite_code
      `;
      break;
    } catch (err) {
      if (String(err.message).includes("duplicate key")) continue;
      throw err;
    }
  }

  if (!familyResult) {
    return NextResponse.json({ error: "Could not create family. Please try again." }, { status: 500 });
  }

  const family = familyResult.rows[0];

  await sql`
    INSERT INTO family_members (family_id, user_id, role)
    VALUES (${family.id}, ${session.userId}, 'admin')
  `;

  return NextResponse.json({ ok: true, family });
}
