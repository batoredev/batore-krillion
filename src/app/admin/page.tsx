import { requireAdmin } from "@/lib/auth";
import { getStore } from "@/lib/store";
import { AdminPanel, type AdminRow } from "./AdminPanel";

export const dynamic = "force-dynamic";

export default async function Admin() {
  const admin = await requireAdmin();
  const store = getStore();
  const users = await store.listUsers();
  const rows: AdminRow[] = [];
  for (const u of users) {
    const results = await store.listResultsForUser(u.id);
    rows.push({ id: u.id, username: u.username, displayName: u.displayName, role: u.role, disabled: u.disabled, createdAt: u.createdAt, lastLoginAt: u.lastLoginAt, games: results.length });
  }
  rows.sort((a, b) => a.username.localeCompare(b.username));
  return (
    <div className="page stack">
      <span className="eyebrow">Mission control</span>
      <h1 className="title">Players</h1>
      <p className="muted">Only accounts created here can log in. Passwords are shown once, when you create or reset them — copy them then.</p>
      <AdminPanel rows={rows} selfId={admin.id} />
    </div>
  );
}
