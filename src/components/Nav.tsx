"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Play", icon: "🚀" },
  { href: "/party", label: "Party", icon: "☄️" },
  { href: "/packs", label: "Packs", icon: "🧭" },
  { href: "/archive", label: "Archive", icon: "🗓️" },
  { href: "/leaderboard", label: "Board", icon: "🏆" },
  { href: "/friends", label: "Friends", icon: "👥" },
  { href: "/account", label: "Me", icon: "🧑‍🚀" },
];

const isActive = (path: string, href: string) => (href === "/" ? path === "/" || path.startsWith("/play") : path.startsWith(href));

export function Nav({ isAdmin }: { isAdmin: boolean }) {
  const path = usePathname();
  const links = isAdmin ? [...LINKS, { href: "/admin", label: "Admin", icon: "🛠️" }] : LINKS;
  return (
    <nav className="nav" aria-label="Main">
      {links.map((l) => (
        <Link key={l.href} href={l.href} className={isActive(path, l.href) ? "active" : ""}>{l.label}</Link>
      ))}
    </nav>
  );
}

export function TabBar() {
  const path = usePathname();
  if (path.startsWith("/play/")) return null; // keep the game screen clear on phones
  const tabs = LINKS.filter((l) => l.href !== "/archive" && l.href !== "/friends");
  return (
    <nav className="tabbar" aria-label="Main">
      {tabs.map((l) => (
        <Link key={l.href} href={l.href} className={isActive(path, l.href) ? "active" : ""}>
          <span aria-hidden="true">{l.icon}</span>
          <span>{l.label}</span>
        </Link>
      ))}
    </nav>
  );
}
