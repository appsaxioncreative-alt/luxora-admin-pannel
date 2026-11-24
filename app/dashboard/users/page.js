"use client";
import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [next, setNext] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (after) => {
    const d = await apiFetch(`/api/users${after ? `?after=${encodeURIComponent(after)}` : ""}`);
    setUsers((prev) => (after ? [...prev, ...d.users] : d.users));
    setNext(d.next);
  }, []);

  useEffect(() => { load().catch((e) => setMsg({ err: e.message })); }, [load]);

  async function add(e) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      await apiFetch("/api/users", { method: "POST", body: JSON.stringify(form) });
      setForm({ name: "", email: "", password: "" });
      setMsg({ ok: "User created" });
      await load();
    } catch (err) { setMsg({ err: err.message }); }
    setBusy(false);
  }

  async function remove(id) {
    if (!confirm("Delete this user?")) return;
    try {
      await apiFetch(`/api/users/${id}`, { method: "DELETE" });
      setUsers((u) => u.filter((x) => x.id !== id));
    } catch (err) { setMsg({ err: err.message }); }
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <h1 className="page-title">Users</h1>
      {msg?.err && <div className="msg err">{msg.err}</div>}
      {msg?.ok && <div className="msg ok">{msg.ok}</div>}

      <form className="card form" onSubmit={add}>
        <div className="field"><label>Name</label><input value={form.name} onChange={set("name")} required /></div>
        <div className="field"><label>Email</label><input type="email" value={form.email} onChange={set("email")} required /></div>
        <div className="field"><label>Password</label><input type="password" minLength={6} value={form.password} onChange={set("password")} required /></div>
        <button className="btn" disabled={busy}>{busy ? "Adding…" : "Add user"}</button>
      </form>

      <div className="list">
        {users.length === 0 && <div className="empty">No users yet</div>}
        {users.map((u) => (
          <div className="row" key={u.id}>
            <div className="row-main">
              <div className="row-title">{u.name}</div>
              <div className="row-sub">{u.email}</div>
            </div>
            <button className="btn btn-danger btn-sm" onClick={() => remove(u.id)}>Delete</button>
          </div>
        ))}
      </div>
      {next && <button className="btn btn-ghost" style={{ marginTop: 14 }} onClick={() => load(next)}>Load more</button>}
    </>
  );
}
