import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Logo } from "@/components/Logo";
import { Nav, TabBar } from "@/components/Nav";
import { getCurrentUser } from "@/lib/auth";
import { partyEnabled } from "@/party/enabled";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const space = Space_Grotesk({ subsets: ["latin"], variable: "--font-space", weight: ["500", "700"], display: "swap" });

export const metadata: Metadata = {
  title: "Kribatov",
  description: "Name the rarest answer you can. Seven prompts, 25 seconds each — rarer answers launch you higher.",
  icons: { icon: "/icon.svg" },
};
export const viewport: Viewport = { themeColor: "#050813", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <html lang="en" className={`${inter.variable} ${space.variable}`}>
      <body>
        <header className="topbar">
          <div className="container topbar-inner">
            <Link href="/" aria-label="Kribatov home"><Logo /></Link>
            {user && <Nav isAdmin={user.role === "admin"} party={partyEnabled()} />}
            {user && (
              <Link href="/account" className="userchip" title="Your account">
                <span className="pill">🧑‍🚀 {user.displayName}</span>
              </Link>
            )}
          </div>
        </header>
        <main className="container">{children}</main>
        {user && <TabBar party={partyEnabled()} />}
      </body>
    </html>
  );
}
