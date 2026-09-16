import { NextResponse } from "next/server";
import { ensureSchema } from "../../../lib/db";

export const dynamic = "force-dynamic";

// Visit /api/init once after connecting your Postgres database to confirm
// the connection works and the tables are created. Safe to call anytime.
export async function GET() {
  try {
    await ensureSchema();
    return NextResponse.json({ ok: true, message: "Database connected and tables are ready." });
  } catch (err) {
    console.error("Init error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Could not connect to the database." },
      { status: 500 }
    );
  }
}
