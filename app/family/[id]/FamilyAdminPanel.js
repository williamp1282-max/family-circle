"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FamilyAdminPanel({
  familyId,
  isAdmin,
  initialMembers,
  initialInviteCode,
  currentUsername,
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState(initialMembers);
  const [inviteCode, setInviteCode] = useState(initialInviteCode);
  const [error, setError] = useState("");
  const [busyUsername, setBusyUsername] = useState(null);
  const [regenerating, setRegenerating] = useState(false);

  if (!isAdmin) return null;

  async function handleRoleChange(username, role) {
    setError("");
    setBusyUsername(username);
    const res = await fetch(`/api/families/${familyId}/members/role`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, role }),
    });
    const data = await res.json();
    setBusyUsername(null);
    if (!res.ok) {
      setError(data.error || "Could not update that member.");
      return;
    }
    setMembers((prev) => prev.map((m) => (m.username === username ? { ...m, role } : m)));
  }

  async function handleRemove(username) {
    if (!confirm(`Remove ${username} from this family?`)) return;
    setError("");
    setBusyUsername(username);
    const res = await fetch(`/api/families/${familyId}/members/remove`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    const data = await res.json();
    setBusyUsername(null);
    if (!res.ok) {
      setError(data.error || "Could not remove that member.");
      return;
    }
    setMembers((prev) => prev.filter((m) => m.username !== username));
    if (username === currentUsername) {
      router.push("/dashboard");
      router.refresh();
    }
  }

  async function handleRegenerate() {
    if (!confirm("Generate a new invite code? The old code will stop working.")) return;
    setError("");
    setRegenerating(true);
    const res = await fetch(`/api/families/${familyId}/invite-code`, { method: "POST" });
    const data = await res.json();
    setRegenerating(false);
    if (!res.ok) {
      setError(data.error || "Could not regenerate the invite code.");
      return;
    }
    setInviteCode(data.inviteCode);
  }

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h3 style={{ margin: 0 }}>Admin tools</h3>
        <button className="btn-secondary" onClick={() => setOpen((o) => !o)}>
          {open ? "Hide" : "Manage family"}
        </button>
      </div>

      {open && (
        <div style={{ marginTop: 16 }}>
          <div className="field">
            <label>Invite code</label>
            <div className="row">
              <span className="invite-code">{inviteCode}</span>
              <button className="btn-secondary" onClick={handleRegenerate} disabled={regenerating}>
                {regenerating ? "Generating…" : "Regenerate code"}
              </button>
            </div>
          </div>

          <div className="field">
            <label>Members</label>
            <div className="family-list">
              {members.map((m) => (
                <div key={m.username} className="family-item">
                  <div>
                    <div>
                      {m.display_name}
                      {m.username === currentUsername ? " (you)" : ""}
                    </div>
                    <span className="muted">{m.role}</span>
                  </div>
                  <div className="row">
                    {m.role === "member" ? (
                      <button
                        className="btn-secondary"
                        onClick={() => handleRoleChange(m.username, "admin")}
                        disabled={busyUsername === m.username}
                      >
                        Make admin
                      </button>
                    ) : (
                      <button
                        className="btn-secondary"
                        onClick={() => handleRoleChange(m.username, "member")}
                        disabled={busyUsername === m.username}
                      >
                        Remove admin
                      </button>
                    )}
                    <button
                      onClick={() => handleRemove(m.username)}
                      disabled={busyUsername === m.username}
                      style={{ background: "var(--danger)" }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && <div className="error">{error}</div>}
        </div>
      )}
    </div>
  );
}
