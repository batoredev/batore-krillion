"use client";
import { useState } from "react";

export function LoginForm({ next }: { next: string }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError("");
    const res = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ username, password }) });
    const data = await res.json().catch(() => ({}));
    if (res.ok) { window.location.href = next; return; }
    setError(data.error || "Login failed"); setBusy(false);
  };

  return (
    <form className="stack" onSubmit={submit}>
      <label className="field">Username
        <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoCapitalize="off" autoCorrect="off" spellCheck={false} required autoFocus />
      </label>
      <label className="field">Password
        <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
      </label>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="btn btn-primary btn-block" disabled={busy}>{busy ? "Checking…" : "Log in ▲"}</button>
    </form>
  );
}
