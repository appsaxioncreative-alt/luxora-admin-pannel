"use client";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const links = [
  { href: "/dashboard", label: "Home", icon: "🏠" },
  { href: "/dashboard/works", label: "Works", icon: "🛠️" },
  { href: "/dashboard/users", label: "Users", icon: "👥" },
  { href: "/dashboard/roles", label: "Roles", icon: "🛡️" },
  { href: "/dashboard/vehicles", label: "Vehicles", icon: "🚗" },
  { href: "/dashboard/items", label: "Items", icon: "📦" },
];

export default function DashboardLayout({ children }) {
  const { user, isAdmin, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) router.replace("/login");
  }, [user, isAdmin, loading, router]);

  if (loading || !user || !isAdmin) return <div className="center spinner">Loading…</div>;

  return (
    <div className="shell">
      <nav className="sidebar">
        <div className="brand">💜 Admin</div>
        {links.map((l) => (
          <Link key={l.href} href={l.href} className={`nav-link ${pathname === l.href ? "active" : ""}`}>
            <span>{l.icon}</span> {l.label}
          </Link>
        ))}
        <div className="spacer" />
        <a className="nav-link" href="#" onClick={(e) => { e.preventDefault(); logout(); }}>
          <span>🚪</span> Logout
        </a>
      </nav>
      <main className="main">{children}</main>
    </div>
  );
}
