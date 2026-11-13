import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./LoginForm";
import { RocketIcon } from "@/components/Logo";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getCurrentUser()) redirect("/");
  const { next } = await searchParams;
  return (
    <div className="page" style={{ display: "grid", placeItems: "center", minHeight: "calc(100dvh - 60px)" }}>
      <div className="card stack" style={{ width: "100%", maxWidth: 400 }}>
        <div className="row"><RocketIcon size={40} /><div><h1 className="h2">Welcome aboard</h1><p className="muted small">Log in with the account your admin gave you.</p></div></div>
        <LoginForm next={next && next.startsWith("/") && !next.startsWith("//") ? next : "/"} />
        <p className="faint small">No account? Ask your Kribatov admin to create one for you.</p>
      </div>
    </div>
  );
}
