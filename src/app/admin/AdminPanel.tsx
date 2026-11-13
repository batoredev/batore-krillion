"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export interface AdminRow { id: string; username: string; displayName: string; role: string; disabled: boolean; createdAt: string; lastLoginAt: string | null; games: number }

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "Never");

export function AdminPanel({ rows, selfId }: { rows: AdminRow[]; selfId: string }) {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", displayName: "", password: "", role: "player" });
  const [created, setCreated] = useState<{ username: string; password: string; label: string } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("");

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(""); setCreated(null);
    const res = await fetch("/api/admin/users", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setError(data.error || "Couldn't create player"); return; }
    setCreated({ username: data.user.username, password: data.password, label: "New player created" });
    setForm({ username: "", displayName: "", password: "", role: "player" });
    router.refresh();
  };

  const act = async (id: string, action: string, username: string) => {
    if (action === "disable" && !confirm(`Disable @${username}? They'll be logged out and can't log in.`)) return;
    if (action === "reset-password" && !confirm(`Reset @${username}'s password? They'll be logged out everywhere.`)) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ action }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { alert(data.error || "Action failed"); return; }
    if (action === "reset-password") setCreated({ username, password: data.password, label: "Password reset" });
    router.refresh();
  };

  const shown = rows.filter((r) => !filter || r.username.includes(filter.toLowerCase()) || r.displayName.toLowerCase().includes(filter.toLowerCase()));

  return (
    <>
      <section className="card stack">
        <h2 className="h2">Create a player</h2>
        <form className="grid" onSubmit={create} style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", alignItems: "end" }}>
          <label className="field">Username
            <input className="input" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase() })} placeholder="e.g. rahul_k" autoCapitalize="off" autoCorrect="off" spellCheck={false} required pattern="[a-z0-9_]{3,20}" title="3–20 lowercase letters, numbers or _" />
          </label>
          <label className="field">Display name
            <input className="input" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} placeholder="Rahul K" maxLength={40} />
          </label>
          <label className="field">Password <span className="faint">(blank = auto-generate)</span>
            <input className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="auto" autoComplete="new-password" />
          </label>
          <label className="field">Role
            <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="player">Player</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <button className="btn btn-primary" disabled={busy}>{busy ? "Creating…" : "Create player"}</button>
        </form>
        {error && <p className="error">{error}</p>}
        {created && (
          <div className="stack" style={{ gap: 6 }}>
            <p className="success">{created.label}. Send these login details to the player — the password won&apos;t be shown again.</p>
            <div className="secret">Username: {created.username}{"\n"}Password: {created.password}</div>
          </div>
        )}
      </section>

      <section className="card stack">
        <div className="row"><h2 className="h2">All players ({rows.length})</h2><span className="spacer" />
          <input className="input" style={{ maxWidth: 220 }} placeholder="Search…" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Search players" />
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Player</th><th>Role</th><th>Games</th><th>Last login</th><th>Actions</th></tr></thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.id} style={r.disabled ? { opacity: 0.5 } : undefined}>
                  <td><strong>{r.displayName}</strong><div className="faint small">@{r.username}{r.disabled ? " · disabled" : ""}</div></td>
                  <td>{r.role === "admin" ? <span className="pill pill-accent">Admin</span> : <span className="pill">Player</span>}</td>
                  <td className="mono">{r.games}</td>
                  <td className="small muted">{when(r.lastLoginAt)}</td>
                  <td>
                    <div className="row" style={{ gap: 6, flexWrap: "nowrap" }}>
                      <button className="btn btn-sm" onClick={() => act(r.id, "reset-password", r.username)}>Reset password</button>
                      {r.id !== selfId && (r.disabled
                        ? <button className="btn btn-sm" onClick={() => act(r.id, "enable", r.username)}>Enable</button>
                        : <button className="btn btn-sm btn-danger" onClick={() => act(r.id, "disable", r.username)}>Disable</button>)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
