"use client";
import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

const TYPES = ["Car", "Bike", "Van", "Truck", "Bus", "Other"];
const ICONS = { Car: "🚗", Bike: "🏍️", Van: "🚐", Truck: "🚚", Bus: "🚌", Other: "🚙" };
const EMPTY = { name: "", number: "", type: "Car", driver: "", notes: "" };

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [next, setNext] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (after) => {
    const d = await apiFetch(`/api/vehicles${after ? `?after=${encodeURIComponent(after)}` : ""}`);
    setVehicles((prev) => (after ? [...prev, ...d.vehicles] : d.vehicles));
    setNext(d.next);
  }, []);

  useEffect(() => { load().catch((e) => setMsg({ err: e.message })); }, [load]);

  async function add(e) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      await apiFetch("/api/vehicles", { method: "POST", body: JSON.stringify(form) });
      setForm(EMPTY);
      setMsg({ ok: "Vehicle added" });
      await load();
    } catch (err) { setMsg({ err: err.message }); }
    setBusy(false);
  }

  async function remove(id) {
    if (!confirm("Delete this vehicle?")) return;
    try {
      await apiFetch(`/api/vehicles/${id}`, { method: "DELETE" });
      setVehicles((list) => list.filter((v) => v.id !== id));
    } catch (err) { setMsg({ err: err.message }); }
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const q = search.trim().toLowerCase();
  const shown = q
    ? vehicles.filter((v) => [v.name, v.number, v.driver, v.type].some((s) => s.toLowerCase().includes(q)))
    : vehicles;

  return (
    <>
      <h1 className="page-title">Vehicles</h1>
      {msg?.err && <div className="msg err">{msg.err}</div>}
      {msg?.ok && <div className="msg ok">{msg.ok}</div>}

      <form className="card form" onSubmit={add}>
        <div className="field"><label>Vehicle name</label><input value={form.name} onChange={set("name")} placeholder="e.g. Toyota Innova" required /></div>
        <div className="field"><label>Number</label><input value={form.number} onChange={set("number")} placeholder="e.g. KL 07 AB 1234" required /></div>
        <div className="field">
          <label>Type</label>
          <select value={form.type} onChange={set("type")}>
            {TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="field"><label>Driver (optional)</label><input value={form.driver} onChange={set("driver")} /></div>
        <div className="field"><label>Notes (optional)</label><input value={form.notes} onChange={set("notes")} /></div>
        <button className="btn" disabled={busy}>{busy ? "Adding…" : "Add vehicle"}</button>
      </form>

      <div className="field" style={{ marginBottom: 14 }}>
        <input placeholder="Search by name, number or driver…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="list">
        {shown.length === 0 && <div className="empty">{q ? "No matching vehicles" : "No vehicles yet"}</div>}
        {shown.map((v) => (
          <div className="row" key={v.id}>
            <div className="row-main">
              <div className="row-title">{ICONS[v.type] || "🚙"} {v.name}</div>
              <div className="row-sub">
                <span className="plate">{v.number}</span>
                {v.driver && <> · {v.driver}</>}
              </div>
              {v.notes && <div className="row-sub">{v.notes}</div>}
            </div>
            <button className="btn btn-danger btn-sm" onClick={() => remove(v.id)}>Delete</button>
          </div>
        ))}
      </div>
      {next && <button className="btn btn-ghost" style={{ marginTop: 14 }} onClick={() => load(next)}>Load more</button>}
    </>
  );
}