"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";

const EMPTY = { name: "", venueType: "Site", location: "", startAt: "", contactName: "", contactPhone: "" };
const fmt = (iso) => (iso ? new Date(iso).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "—");

export default function WorksPage() {
  const [works, setWorks] = useState([]);
  const [next, setNext] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [picked, setPicked] = useState([]); // [{ itemId, name, quantity }]
  const [typed, setTyped] = useState({ name: "", qty: "1" });
  const [staffIds, setStaffIds] = useState([]);
  const [vehicleList, setVehicleList] = useState([]);
  const [vehicleIds, setVehicleIds] = useState([]);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const loadWorks = useCallback(async (after) => {
    const d = await apiFetch(`/api/works${after ? `?after=${encodeURIComponent(after)}` : ""}`);
    setWorks((prev) => (after ? [...prev, ...d.works] : d.works));
    setNext(d.next);
  }, []);
  const loadInventory = useCallback(async () => setInventory((await apiFetch("/api/inventory")).items), []);
  const loadWorkers = useCallback(async () => setWorkers((await apiFetch("/api/workers")).workers), []);
  const loadVehicles = useCallback(async () => setVehicleList((await apiFetch("/api/vehicle-options")).vehicles), []);

  useEffect(() => {
    const fail = (e) => setMsg({ err: e.message });
    loadWorks().catch(fail); loadInventory().catch(fail); loadWorkers().catch(fail); loadVehicles().catch(fail);
  }, [loadWorks, loadInventory, loadWorkers, loadVehicles]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  // stock left after what is already added to this form
  const usedIn = (id) => picked.find((p) => p.itemId === id)?.quantity || 0;

  // ---- inventory: type the name, enter qty, press Add ----
  const typedItem = useMemo(
    () => inventory.find((i) => i.name.trim().toLowerCase() === typed.name.trim().toLowerCase()),
    [inventory, typed.name]
  );

  function addItem() {
    setMsg(null);
    const qty = Number(typed.qty);
    if (!typed.name.trim()) return setMsg({ err: "Type an item name" });
    if (!typedItem) return setMsg({ err: `"${typed.name}" is not in the inventory. Pick a name from the suggestions.` });
    if (!Number.isInteger(qty) || qty < 1) return setMsg({ err: "Enter a quantity of at least 1" });
    const total = usedIn(typedItem.id) + qty;
    if (total > typedItem.quantity) return setMsg({ err: `Only ${typedItem.quantity} of "${typedItem.name}" in stock` });
    setPicked((list) =>
      list.some((p) => p.itemId === typedItem.id)
        ? list.map((p) => (p.itemId === typedItem.id ? { ...p, quantity: total } : p))
        : [...list, { itemId: typedItem.id, name: typedItem.name, quantity: qty }]
    );
    setTyped({ name: "", qty: "1" });
  }

  const removeItem = (id) => setPicked((l) => l.filter((p) => p.itemId !== id));
  const toggleWorker = (id) => setStaffIds((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]));
  const toggleVehicle = (id) => setVehicleIds((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]));

  async function create(e) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      await apiFetch("/api/works", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          startAt: new Date(form.startAt).toISOString(),
          items: picked.map(({ itemId, quantity }) => ({ itemId, quantity })),
          staffIds,
          vehicleIds,
        }),
      });
      setForm(EMPTY); setPicked([]); setStaffIds([]); setVehicleIds([]); setTyped({ name: "", qty: "1" });
      setMsg({ ok: "Work created, workers assigned and inventory updated" });
      await Promise.all([loadWorks(), loadInventory()]);
    } catch (err) { setMsg({ err: err.message }); loadInventory().catch(() => {}); }
    setBusy(false);
  }

  async function close(w, status) {
    const word = status === "completed" ? "mark as completed" : "cancel";
    if (!confirm(`${word[0].toUpperCase() + word.slice(1)} "${w.name}"? Its items will be returned to inventory.`)) return;
    try {
      await apiFetch(`/api/works/${w.id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      await Promise.all([loadWorks(), loadInventory()]);
    } catch (err) { setMsg({ err: err.message }); }
  }

  return (
    <>
      <h1 className="page-title">Works</h1>
      {msg?.err && <div className="msg err">{msg.err}</div>}
      {msg?.ok && <div className="msg ok">{msg.ok}</div>}

      <form className="card" onSubmit={create}>
        <h2 className="section-title">Create work</h2>
        <div className="form">
          <div className="field"><label>Work name</label><input value={form.name} onChange={set("name")} placeholder="e.g. Sharma wedding setup" required /></div>
          <div className="field"><label>Venue type</label>
            <select value={form.venueType} onChange={set("venueType")}>
              <option>Site</option><option>Convention Centre</option>
            </select>
          </div>
          <div className="field"><label>{form.venueType === "Site" ? "Site name & location" : "Convention centre & location"}</label><input value={form.location} onChange={set("location")} placeholder="Venue name, area, city" required /></div>
          <div className="field"><label>Start date & time</label><input type="datetime-local" value={form.startAt} onChange={set("startAt")} required /></div>
          <div className="field"><label>Site contact name</label><input value={form.contactName} onChange={set("contactName")} placeholder="Person at the site" /></div>
          <div className="field"><label>Site contact phone</label><input type="tel" inputMode="tel" value={form.contactPhone} onChange={set("contactPhone")} placeholder="Phone number" /></div>
        </div>

        <h3 className="section-title">Inventory items</h3>
        <div className="form" style={{ marginBottom: 8 }}>
          <div className="field">
            <label>Type item name</label>
            <input
              list="inventory-names"
              value={typed.name}
              onChange={(e) => setTyped({ ...typed, name: e.target.value })}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addItem(); } }}
              placeholder="Start typing…"
            />
            <datalist id="inventory-names">
              {inventory.filter((i) => i.quantity > 0).map((i) => <option key={i.id} value={i.name}>{i.quantity} in stock</option>)}
            </datalist>
          </div>
          <div className="field">
            <label>Quantity{typedItem ? ` (in stock: ${typedItem.quantity - usedIn(typedItem.id)})` : ""}</label>
            <input type="number" min="1" step="1" inputMode="numeric" value={typed.qty} onChange={(e) => setTyped({ ...typed, qty: e.target.value })} />
          </div>
          <button type="button" className="btn btn-ghost" onClick={addItem}>+ Add item</button>
        </div>

        <div className="list" style={{ marginBottom: 18 }}>
          {picked.length === 0 && <div className="empty">No items added</div>}
          {picked.map((p) => (
            <div className="row" key={p.itemId}>
              <div className="row-main"><div className="row-title">{p.name}</div></div>
              <div className="row-actions">
                <span className="badge">× {p.quantity}</span>
                <button type="button" className="btn btn-danger btn-sm" onClick={() => removeItem(p.itemId)}>Remove</button>
              </div>
            </div>
          ))}
        </div>

        <h3 className="section-title">Assign workers ({staffIds.length} selected)</h3>
        <div className="worker-grid" style={{ marginBottom: 18 }}>
          {workers.length === 0 && <div className="empty">No workers yet. Add them on the Users page.</div>}
          {workers.map((w) => (
            <label key={w.id} className={`worker-chip ${staffIds.includes(w.id) ? "on" : ""}`}>
              <input type="checkbox" checked={staffIds.includes(w.id)} onChange={() => toggleWorker(w.id)} />
              {w.name}
            </label>
          ))}
        </div>

        <h3 className="section-title">Vehicles ({vehicleIds.length} selected)</h3>
        <div className="worker-grid" style={{ marginBottom: 18 }}>
          {vehicleList.length === 0 && <div className="empty">No vehicles yet. Add them on the Vehicles page.</div>}
          {vehicleList.map((v) => (
            <label key={v.id} className={`worker-chip ${vehicleIds.includes(v.id) ? "on" : ""}`}>
              <input type="checkbox" checked={vehicleIds.includes(v.id)} onChange={() => toggleVehicle(v.id)} />
              🚗 {v.name} · {v.number}
            </label>
          ))}
        </div>

        <button className="btn" disabled={busy}>{busy ? "Creating…" : "Create work (status: ongoing)"}</button>
      </form>

      <h2 className="section-title" style={{ marginTop: 28 }}>All works</h2>
      <div className="list">
        {works.length === 0 && <div className="empty">No works yet</div>}
        {works.map((w) => (
          <div className="card work" key={w.id}>
            <div className="work-head">
              <div>
                <div className="row-title">{w.name}</div>
                <div className="row-sub">{w.venueType} · {w.location}</div>
                <div className="row-sub">🕒 {fmt(w.startAt)}</div>
              </div>
              <span className={`status status-${w.status}`}>{w.status}</span>
            </div>
            {(w.contactName || w.contactPhone) && (
              <div className="row-sub" style={{ marginTop: 6 }}>
                📞 {w.contactName}{w.contactName && w.contactPhone ? " · " : ""}
                {w.contactPhone && <a href={`tel:${w.contactPhone}`}>{w.contactPhone}</a>}
              </div>
            )}
            <div className="work-items">
              {w.items.length === 0 ? <span className="row-sub">No items</span> :
                w.items.map((i) => <span key={i.itemId} className="badge">{i.name} × {i.quantity}</span>)}
            </div>
            <div className="row-sub" style={{ marginTop: 8 }}>
              👷 {w.staff.length ? w.staff.map((s) => s.name).join(", ") : "No workers assigned"}
            </div>
            <div className="row-sub" style={{ marginTop: 4 }}>
              🚗 {w.vehicles?.length ? w.vehicles.map((v) => `${v.name} (${v.number})`).join(", ") : "No vehicles"}
            </div>
            {w.status === "ongoing" && (
              <div className="row-actions" style={{ marginTop: 12 }}>
                <button className="btn btn-sm" onClick={() => close(w, "completed")}>Mark completed</button>
                <button className="btn btn-danger btn-sm" onClick={() => close(w, "cancelled")}>Cancel</button>
              </div>
            )}
          </div>
        ))}
      </div>
      {next && <button className="btn btn-ghost" style={{ marginTop: 14 }} onClick={() => loadWorks(next)}>Load more</button>}
    </>
  );
}