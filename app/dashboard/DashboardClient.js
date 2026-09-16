"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardClient({ families }) {
  const router = useRouter();
  const [mode, setMode] = useState(null); // null | "create" | "join"
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/families", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Could not create family.");
      return;
    }
    router.push(`/family/${data.family.id}`);
  }

  async function handleJoin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/families/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteCode }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Could not join family.");
      return;
    }
    router.push(`/family/${data.family.id}`);
  }

  return (
    <div>
      {families.length === 0 ? (
        <div className="card empty-state">
          You're not part of a family circle yet. Create one, or join with an invite code from a family member.
        </div>
      ) : (
        <div className="family-list">
          {families.map((f) => (
            <a key={f.id} href={`/family/${f.id}`} className="family-item">
              <div>
                <h3>{f.name}</h3>
                <span className="muted">
                  {f.member_count} member{f.member_count == 1 ? "" : "s"}
                  {f.role === "admin" ? " · you're the admin" : ""}
                </span>
              </div>
              <span>→</span>
            </a>
          ))}
        </div>
      )}

      <hr className="divider" />

      {mode === null && (
        <div className="row" style={{ justifyContent: "center" }}>
          <button onClick={() => setMode("create")}>+ Create a family</button>
          <button className="btn-secondary" onClick={() => setMode("join")}>
            Join with invite code
          </button>
        </div>
      )}

      {mode === "create" && (
        <form className="card" onSubmit={handleCreate}>
          <h3>Create a new family circle</h3>
          <div className="field">
            <label htmlFor="familyName">Family name</label>
            <input
              id="familyName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="The Peterson Family"
              required
              maxLength={80}
            />
          </div>
          {error && <div className="error">{error}</div>}
          <div className="row">
            <button type="submit" disabled={loading}>
              {loading ? "Creating…" : "Create family"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setMode(null);
                setError("");
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {mode === "join" && (
        <form className="card" onSubmit={handleJoin}>
          <h3>Join a family with an invite code</h3>
          <div className="field">
            <label htmlFor="inviteCode">Invite code</label>
            <input
              id="inviteCode"
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="ABC1234"
              required
              maxLength={10}
              style={{ letterSpacing: 2, fontFamily: "monospace" }}
            />
          </div>
          {error && <div className="error">{error}</div>}
          <div className="row">
            <button type="submit" disabled={loading}>
              {loading ? "Joining…" : "Join family"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setMode(null);
                setError("");
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
