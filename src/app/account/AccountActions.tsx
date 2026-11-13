"use client";
import { useState } from "react";

export function AccountActions() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const change = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/account/password", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ current, next }) });
    const data = await res.json().catch(() => ({}));
    if (res.ok) { setMsg({ text: "Password changed.", ok: true }); setCurrent(""); setNext(""); }
    else setMsg({ text: data.error || "Couldn't change password", ok: false });
  };
  const logout = async () => { await fetch("/api/auth/logout", { method: "POST" }); window.location.href = "/login"; };

  return (
    <section className="card stack">
      <h2 className="h2">Account</h2>
      <form className="stack" onSubmit={change} style={{ maxWidth: 420 }}>
        <label className="field">Current password<input className="input" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required /></label>
        <label className="field">New password<input className="input" type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" minLength={6} required /></label>
        {msg && <p className={msg.ok ? "success" : "error"}>{msg.text}</p>}
        <div className="row"><button className="btn">Change password</button></div>
      </form>
      <div className="row"><button className="btn btn-ghost btn-danger" onClick={logout}>Log out</button></div>
    </section>
  );
}
