import { redirect } from "next/navigation";
import { getSession } from "../../lib/session";
import { sql, ensureSchema } from "../../lib/db";
import TopBar from "../components/TopBar";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = getSession();
  if (!session) redirect("/login");

  await ensureSchema();

  const result = await sql`
    SELECT f.id, f.name, f.invite_code, fm.role,
           (SELECT COUNT(*) FROM family_members WHERE family_id = f.id) AS member_count
    FROM families f
    JOIN family_members fm ON fm.family_id = f.id
    WHERE fm.user_id = ${session.userId}
    ORDER BY f.created_at DESC
  `;

  return (
    <>
      <TopBar displayName={session.displayName} />
      <div className="page">
        <h1>Your families</h1>
        <DashboardClient families={result.rows} />
      </div>
    </>
  );
}
