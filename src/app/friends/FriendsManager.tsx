"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Friend { id: string; username: string; displayName: string; streak: number; today: number | null }

export function FriendsManager({ friends }: { friends: Friend[] }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const res = await fetch("/api/friends", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ username }) });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setMsg({ text: data.error || "Couldn't add friend", ok: false }); return; }
    setMsg({ text: `Added ${data.friend.displayName}.`, ok: true }); setUsername(""); router.refresh();
  };
  const remove = async (id: string) => {
    await fetch("/api/friends", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ userId: id }) });
    router.refresh();
  };

  return (
    <section className="card stack">
      <form className="row" onSubmit={add}>
        <label className="sr-only" htmlFor="friend">Friend&apos;s username</label>
        <input id="friend" className="input" style={{ flex: 1, minWidth: 180 }} placeholder="Friend's username" value={username} onChange={(e) => setUsername(e.target.value)} autoCapitalize="off" autoCorrect="off" spellCheck={false} />
        <button className="btn btn-primary" disabled={busy || !username.trim()}>Add friend</button>
      </form>
      {msg && <p className={msg.ok ? "success" : "error"}>{msg.text}</p>}
      {friends.length === 0 ? <p className="muted">No friends yet.</p> : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Friend</th><th>Streak</th><th>Today</th><th /></tr></thead>
            <tbody>
              {friends.map((f) => (
                <tr key={f.id}>
                  <td><strong>{f.displayName}</strong><div className="faint small">@{f.username}</div></td>
                  <td className="mono">🔥 {f.streak}</td>
                  <td className="mono">{f.today ?? "—"}</td>
                  <td style={{ textAlign: "right" }}><button className="btn btn-sm btn-ghost btn-danger" onClick={() => remove(f.id)}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
