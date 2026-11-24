
"use client";

import { useEffect, useTransition } from "react";
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

  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.replace("/login");
    }
  }, [user, isAdmin, loading, router]);

  const handleNavigation = (e, href) => {
    // Preserve normal browser behavior for new tabs and modified clicks.
    if (
      e.defaultPrevented ||
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey
    ) {
      return;
    }

    e.preventDefault();

    if (pathname === href) return;

    startTransition(() => {
      router.push(href);
    });
  };

  if (loading || !user || !isAdmin) {
    return (
      <div className="center spinner">
        <div className="loading-spinner" />
        Loading...
      </div>
    );
  }

  return (
    <div className="shell">
      <nav className="sidebar">
        <div className="brand">💚 Admin</div>

        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            onClick={(e) => handleNavigation(e, l.href)}
            className={`nav-link ${
              pathname === l.href ? "active" : ""
            }`}
            aria-current={pathname === l.href ? "page" : undefined}
          >
            <span>{l.icon}</span>
            {l.label}
          </Link>
        ))}

        <div className="spacer" />

        <a
          className="nav-link"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            logout();
          }}
        >
          <span>🚪</span>
          Logout
        </a>
      </nav>

      <main className="main" aria-busy={isPending}>
        {isPending ? (
          <div className="tab-loading">
            <div className="loading-spinner" />
            <p>Loading page...</p>
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}
