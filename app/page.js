import { redirect } from "next/navigation";
import { getSession } from "../lib/session";

export const dynamic = "force-dynamic";

export default function Home() {
  const session = getSession();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="page">
      <div style={{ textAlign: "center", marginTop: 60, marginBottom: 40 }}>
        <div style={{ fontSize: "2.4rem", marginBottom: 6 }}>🏡</div>
        <h1>Family Circle</h1>
        <p className="muted">
          A private space for your family to share photos and updates — just the people you invite, nothing else.
        </p>
      </div>

      <div className="card" style={{ display: "flex", gap: 12, justifyContent: "center" }}>
        <a className="btn" href="/signup">
          Create an account
        </a>
        <a className="btn btn-secondary" href="/login">
          Log in
        </a>
      </div>

      <div className="muted" style={{ textAlign: "center", marginTop: 24 }}>
        Each family gets its own private group with an invite code — no one sees anything unless they're invited.
      </div>
    </div>
  );
}
