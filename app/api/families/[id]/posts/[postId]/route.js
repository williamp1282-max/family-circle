import { NextResponse } from "next/server";
import { sql, ensureSchema } from "../../../../../../lib/db";
import { getSession } from "../../../../../../lib/session";
import { getRole } from "../../../../../../lib/family";

export const dynamic = "force-dynamic";

export async function DELETE(request, { params }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const familyId = Number(params.id);
  const postId = Number(params.postId);
  await ensureSchema();

  const role = await getRole(familyId, session.userId);
  if (!role) {
    return NextResponse.json({ error: "You are not a member of this family." }, { status: 403 });
  }

  const postResult = await sql`
    SELECT user_id FROM posts WHERE id = ${postId} AND family_id = ${familyId}
  `;
  const post = postResult.rows[0];
  if (!post) {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }

  const isOwner = post.user_id === session.userId;
  const isAdmin = role === "admin";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "You can only delete your own posts." }, { status: 403 });
  }

  await sql`DELETE FROM posts WHERE id = ${postId}`;

  return NextResponse.json({ ok: true });
}
