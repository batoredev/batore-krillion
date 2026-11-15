"use client";
import { useState } from "react";

export function LogoutButton({ compact = false }: { compact?: boolean }) {
  const [busy, setBusy] = useState(false);
  const logout = async () => {
    setBusy(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    window.location.href = "/login";
  };
  return (
    <button className="btn btn-sm btn-ghost logout-btn" onClick={logout} disabled={busy} title="Log out" aria-label="Log out">
      <span aria-hidden="true">⏻</span>{!compact && <span className="logout-label">{busy ? "…" : "Log out"}</span>}
    </button>
  );
}
