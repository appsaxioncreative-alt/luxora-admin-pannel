"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export default function Overview() {
  const [users, setUsers] = useState(null);
  const [items, setItems] = useState(null);

  useEffect(() => {
    apiFetch("/api/users").then((d) => setUsers(d.users.length + (d.next ? "+" : ""))).catch(() => setUsers("–"));
    apiFetch("/api/items").then((d) => setItems(d.items.length + (d.next ? "+" : ""))).catch(() => setItems("–"));
  }, []);

  return (
    <>
      <h1 className="page-title">Overview</h1>
      <div className="stats">
        <div className="card"><div className="stat-num">{users ?? "…"}</div><div className="stat-label">Users</div></div>
        <div className="card"><div className="stat-num">{items ?? "…"}</div><div className="stat-label">Items</div></div>
      </div>
    </>
  );
}
