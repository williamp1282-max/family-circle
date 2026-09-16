import { NextResponse } from "next/server";
import { sql, ensureSchema } from "../../../../../../lib/db";
import { getSession } from "../../../../../../lib/session";
import { getRole, countAdmins, getUserIdByUsername } from "../../../../../../lib/family";

export const dynamic = "force-dynamic";

export async function POST(request, { params }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const familyId = Number(params.id);
  await ensureSchema();

  const requesterRole = await getRole(familyId, session.userId);
  if (requesterRole !== "admin") {
    return NextResponse.json({ error: "Only admins can change roles." }, { status: 403 });
  }

  const { username, role } = await request.json();
  if (!username || !["admin", "member"].includes(role)) {
    return NextResponse.json({ error: "A valid username and role are required." }, { status: 400 });
  }

  const targetUserId = await getUserIdByUsername(username);
  if (!targetUserId) {
    return NextResponse.json({ error: "That person isn't a member." }, { status: 404 });
  }

  const targetRole = await getRole(familyId, targetUserId);
  if (!targetRole) {
    return NextResponse.json({ error: "That person isn't a member." }, { status: 404 });
  }

  if (targetRole === "admin" && role === "member") {
    const adminCount = await countAdmins(familyId);
    if (adminCount <= 1) {
      return NextResponse.json(
        { error: "You can't demote the only admin. Promote someone else first." },
        { status: 400 }
      );
    }
  }

  await sql`
    UPDATE family_members SET role = ${role}
    WHERE family_id = ${familyId} AND user_id = ${targetUserId}
  `;

  return NextResponse.json({ ok: true });
}
