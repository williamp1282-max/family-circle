import { NextResponse } from "next/server";
import { sql, ensureSchema } from "../../../../../lib/db";
import { getSession } from "../../../../../lib/session";

export const dynamic = "force-dynamic";

async function isMember(familyId, userId) {
  const result = await sql`
    SELECT 1 FROM family_members WHERE family_id = ${familyId} AND user_id = ${userId}
  `;
  return result.rows.length > 0;
}

export async function GET(request, { params }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const familyId = Number(params.id);
  await ensureSchema();

  if (!(await isMember(familyId, session.userId))) {
    return NextResponse.json({ error: "You are not a member of this family." }, { status: 403 });
  }

  const result = await sql`
    SELECT p.id, p.caption, p.image_url, p.created_at, u.display_name AS author
    FROM posts p
    JOIN users u ON u.id = p.user_id
    WHERE p.family_id = ${familyId}
    ORDER BY p.created_at DESC
    LIMIT 100
  `;

  return NextResponse.json({ posts: result.rows });
}

export async function POST(request, { params }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const familyId = Number(params.id);
  await ensureSchema();

  if (!(await isMember(familyId, session.userId))) {
    return NextResponse.json({ error: "You are not a member of this family." }, { status: 403 });
  }

  const { caption, imageUrl } = await request.json();

  if (!caption?.trim() && !imageUrl) {
    return NextResponse.json({ error: "Add a photo or a caption before posting." }, { status: 400 });
  }

  const result = await sql`
    INSERT INTO posts (family_id, user_id, caption, image_url)
    VALUES (${familyId}, ${session.userId}, ${caption?.trim() || null}, ${imageUrl || null})
    RETURNING id, caption, image_url, created_at
  `;

  return NextResponse.json({ ok: true, post: result.rows[0] });
}
