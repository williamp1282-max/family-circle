import { redirect, notFound } from "next/navigation";
import { getSession } from "../../../lib/session";
import { sql, ensureSchema } from "../../../lib/db";
import TopBar from "../../components/TopBar";
import FamilyFeedClient from "./FamilyFeedClient";

export const dynamic = "force-dynamic";

export default async function FamilyPage({ params }) {
  const session = getSession();
  if (!session) redirect("/login");

  const familyId = Number(params.id);
  await ensureSchema();

  const familyResult = await sql`
    SELECT f.id, f.name, f.invite_code, fm.role
    FROM families f
    JOIN family_members fm ON fm.family_id = f.id
    WHERE f.id = ${familyId} AND fm.user_id = ${session.userId}
  `;
  const family = familyResult.rows[0];
  if (!family) notFound();

  const postsResult = await sql`
    SELECT p.id, p.caption, p.image_url, p.created_at, u.display_name AS author
    FROM posts p
    JOIN users u ON u.id = p.user_id
    WHERE p.family_id = ${familyId}
    ORDER BY p.created_at DESC
    LIMIT 100
  `;

  const membersResult = await sql`
    SELECT u.display_name, fm.role
    FROM family_members fm
    JOIN users u ON u.id = fm.user_id
    WHERE fm.family_id = ${familyId}
    ORDER BY fm.joined_at ASC
  `;

  return (
    <>
      <TopBar displayName={session.displayName} backHref="/dashboard" />
      <div className="page">
        <a href="/dashboard" className="muted">
          ← All families
        </a>
        <h1 style={{ marginTop: 8 }}>{family.name}</h1>

        <div className="card">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div>
              <div className="muted" style={{ marginBottom: 4 }}>
                Invite code — share this with family members
              </div>
              <span className="invite-code">{family.invite_code}</span>
            </div>
            <div className="muted">
              {membersResult.rows.length} member{membersResult.rows.length === 1 ? "" : "s"}:{" "}
              {membersResult.rows.map((m) => m.display_name).join(", ")}
            </div>
          </div>
        </div>

        <FamilyFeedClient familyId={family.id} initialPosts={postsResult.rows} />
      </div>
    </>
  );
}
