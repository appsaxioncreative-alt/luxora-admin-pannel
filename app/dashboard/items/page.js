"use client";
import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export default function ItemsPage() {
  const [items, setItems] = useState([]);
  const [next, setNext] = useState(null);
  const [form, setForm] = useState({ name: "", quantity: "" });
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (after) => {
    const d = await apiFetch(`/api/items${after ? `?after=${encodeURIComponent(after)}` : ""}`);
    setItems((prev) => (after ? [...prev, ...d.items] : d.items));
    setNext(d.next);
  }, []);

  useEffect(() => { load().catch((e) => setMsg({ err: e.message })); }, [load]);

  async function add(e) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      await apiFetch("/api/items", { method: "POST", body: JSON.stringify(form) });
      setForm({ name: "", quantity: "" });
      await load();
    } catch (err) { setMsg({ err: err.message }); }
    setBusy(false);
  }

  async function changeQty(item, delta) {
    const quantity = Math.max(0, item.quantity + delta);
    setItems((list) => list.map((i) => (i.id === item.id ? { ...i, quantity } : i)));
    try {
      await apiFetch(`/api/items/${item.id}`, { method: "PATCH", body: JSON.stringify({ quantity }) });
    } catch (err) { setMsg({ err: err.message }); load(); }
  }

  async function remove(id) {
    if (!confirm("Delete this item?")) return;
    try {
      await apiFetch(`/api/items/${id}`, { method: "DELETE" });
      setItems((list) => list.filter((i) => i.id !== id));
    } catch (err) { setMsg({ err: err.message }); }
  }

  return (
    <>
      <h1 className="page-title">Items</h1>
      {msg?.err && <div className="msg err">{msg.err}</div>}

      <form className="card form" onSubmit={add}>
        <div className="field"><label>Item name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
        <div className="field"><label>Quantity</label><input type="number" min="0" step="1" inputMode="numeric" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required /></div>
        <button className="btn" disabled={busy}>{busy ? "Adding…" : "Add item"}</button>
      </form>

      <div className="list">
        {items.length === 0 && <div className="empty">No items yet</div>}
        {items.map((i) => (
          <div className="row" key={i.id}>
            <div className="row-main"><div className="row-title">{i.name}</div></div>
            <div className="row-actions">
              <div className="qty">
                <button onClick={() => changeQty(i, -1)} aria-label="Decrease">−</button>
                <span>{i.quantity}</span>
                <button onClick={() => changeQty(i, 1)} aria-label="Increase">+</button>
              </div>
              <button className="btn btn-danger btn-sm" onClick={() => remove(i.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
      {next && <button className="btn btn-ghost" style={{ marginTop: 14 }} onClick={() => load(next)}>Load more</button>}
    </>
  );
}
