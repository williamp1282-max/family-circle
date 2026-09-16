"use client";

import { useRouter } from "next/navigation";

export default function TopBar({ displayName, backHref }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="topbar">
      <div className="brand">
        <span>🏡</span>
        {backHref ? <a href={backHref}>Family Circle</a> : <span>Family Circle</span>}
      </div>
      <div className="row" style={{ gap: 14 }}>
        <span className="muted">Hi, {displayName}</span>
        <button className="btn-secondary" onClick={handleLogout} style={{ background: "transparent" }}>
          Log out
        </button>
      </div>
    </div>
  );
}
