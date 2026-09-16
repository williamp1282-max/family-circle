import { NextResponse } from "next/server";
import { sql, ensureSchema } from "../../../../lib/db";
import { getSession } from "../../../../lib/session";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const familyId = Number(params.id);
  await ensureSchema();

  const result = await sql`
    SELECT f.id, f.name, f.invite_code, fm.role
    FROM families f
    JOIN family_members fm ON fm.family_id = f.id
    WHERE f.id = ${familyId} AND fm.user_id = ${session.userId}
  `;

  const family = result.rows[0];
  if (!family) {
    return NextResponse.json({ error: "Family not found or you are not a member." }, { status: 404 });
  }

  const members = await sql`
    SELECT u.display_name, fm.role
    FROM family_members fm
    JOIN users u ON u.id = fm.user_id
    WHERE fm.family_id = ${familyId}
    ORDER BY fm.joined_at ASC
  `;

  return NextResponse.json({ family, members: members.rows });
}
