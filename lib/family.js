import { sql } from "./db";

// Returns 'admin' | 'member' | null
export async function getRole(familyId, userId) {
  const result = await sql`
    SELECT role FROM family_members WHERE family_id = ${familyId} AND user_id = ${userId}
  `;
  return result.rows[0]?.role || null;
}

export async function countAdmins(familyId) {
  const result = await sql`
    SELECT COUNT(*) AS count FROM family_members WHERE family_id = ${familyId} AND role = 'admin'
  `;
  return Number(result.rows[0].count);
}

export async function getUserIdByUsername(username) {
  const result = await sql`SELECT id FROM users WHERE username = ${username.trim().toLowerCase()}`;
  return result.rows[0]?.id || null;
}
