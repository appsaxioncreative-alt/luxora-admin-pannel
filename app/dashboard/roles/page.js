"use client";
import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const ROLES = [
  { value: "user", label: "User" },
  { value: "staff", label: "Staff" },
  { value: "admin", label: "Admin" },
];

export default function RolesPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [next, setNext] = useState(null);
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(null);

  const load = useCallback(async (pageToken) => {
    const d = await apiFetch(`/api/roles${pageToken ? `?pageToken=${encodeURIComponent(pageToken)}` : ""}`);
    setUsers((prev) => (pageToken ? [...prev, ...d.users] : d.users));
    setNext(d.next);
  }, []);

  useEffect(() => { load().catch((e) => setMsg({ err: e.message })); }, [load]);

  async function changeRole(u, role) {
    if (role === u.role) return;
    setSaving(u.id); setMsg(null);
    try {
      await apiFetch(`/api/roles/${u.id}`, { method: "PATCH", body: JSON.stringify({ role }) });
      setUsers((list) => list.map((x) => (x.id === u.id ? { ...x, role } : x)));
      setMsg({ ok: `${u.email} is now ${role}` });
    } catch (e) {
      setMsg({ err: e.message });
    }
    setSaving(null);
  }

  return (
    <>
      <h1 className="page-title">Roles</h1>
      {msg?.err && <div className="msg err">{msg.err}</div>}
      {msg?.ok && <div className="msg ok">{msg.ok}</div>}

      <div className="list">
        {users.length === 0 && <div className="empty">No users yet</div>}
        {users.map((u) => (
          <div className="row" key={u.id}>
            <div className="row-main">
              <div className="row-title">
                {u.name || u.email} {u.id === me?.uid && <span className="badge">You</span>}
              </div>
              <div className="row-sub">{u.email}</div>
            </div>
            <div className="role-switch">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  disabled={saving === u.id || (u.id === me?.uid && r.value !== "admin")}
                  className={`role-btn ${u.role === r.value ? "on" : ""}`}
                  onClick={() => changeRole(u, r.value)}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      {next && <button className="btn btn-ghost" style={{ marginTop: 14 }} onClick={() => load(next)}>Load more</button>}
    </>
  );
}