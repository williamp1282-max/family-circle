import { NextResponse } from "next/server";
import { sql, ensureSchema } from "../../../../../lib/db";
import { getSession } from "../../../../../lib/session";
import { getRole } from "../../../../../lib/family";
import { generateInviteCode } from "../../../../../lib/utils";

export const dynamic = "force-dynamic";

export async function POST(request, { params }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const familyId = Number(params.id);
  await ensureSchema();

  const requesterRole = await getRole(familyId, session.userId);
  if (requesterRole !== "admin") {
    return NextResponse.json({ error: "Only admins can regenerate the invite code." }, { status: 403 });
  }

  let newCode;
  let result;
  for (let attempt = 0; attempt < 5; attempt++) {
    newCode = generateInviteCode();
    try {
      result = await sql`
        UPDATE families SET invite_code = ${newCode} WHERE id = ${familyId}
        RETURNING invite_code
      `;
      break;
    } catch (err) {
      if (String(err.message).includes("duplicate key")) continue;
      throw err;
    }
  }

  if (!result) {
    return NextResponse.json({ error: "Could not regenerate the code. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, inviteCode: result.rows[0].invite_code });
}
