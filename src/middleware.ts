import { NextResponse, type NextRequest } from "next/server";

// Every page needs a login. This is a fast cookie-presence check; pages and APIs
// still validate the session properly on the server.
const PUBLIC = ["/login", "/api/auth/login"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC.some((p) => pathname === p)) return NextResponse.next();
  if (req.cookies.get("kb_session")) return NextResponse.next();
  if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname)}`;
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/((?!_next/|favicon|icon|.*\\.(?:svg|png|ico|webmanifest)$).*)"] };
