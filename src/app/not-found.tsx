import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page stack" style={{ alignItems: "flex-start" }}>
      <span className="eyebrow">404</span>
      <h1 className="title">Lost in space</h1>
      <p className="muted">That page or set doesn&apos;t exist (future dailies stay locked until their day).</p>
      <Link href="/" className="btn btn-primary">Back to base</Link>
    </div>
  );
}
