import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { verifyAdmin } from "@/lib/verifyAdmin";

const PAGE = 20;
const VENUE_TYPES = ["Site", "Convention Centre"];

export async function GET(request) {
  if (!(await verifyAdmin(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = new URL(request.url).searchParams;
  const after = params.get("after");
  const status = params.get("status"); // optional filter: ongoing | completed | cancelled

  let q = adminDb.collection("works");
  if (status) q = q.where("status", "==", status); // needs a composite index (Firestore shows a link in the error)
  q = q.orderBy("createdAt", "desc").limit(PAGE);
  if (after) q = q.startAfter(new Date(after));

  const snap = await q.get();
  const works = snap.docs.map((d) => {
    const w = d.data();
    return {
      id: d.id,
      name: w.name,
      venueType: w.venueType,
      location: w.location,
      startAt: w.startAt.toDate().toISOString(),
      contactName: w.contactName || "",
      contactPhone: w.contactPhone || "",
      items: w.items || [],
      staff: w.staff || [],
      vehicles: w.vehicles || [],
      status: w.status,
      createdAt: w.createdAt.toDate().toISOString(),
    };
  });
  const next = works.length === PAGE ? works[works.length - 1].createdAt : null;
  return NextResponse.json({ works, next });
}

// Create a work and deduct the chosen items from inventory in ONE transaction:
// either everything is saved, or nothing is (e.g. if stock is not enough).
export async function POST(request) {
  const admin = await verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const name = body.name?.trim();
  const location = body.location?.trim();
  const venueType = VENUE_TYPES.includes(body.venueType) ? body.venueType : "Site";
  const startAt = new Date(body.startAt);

  if (!name || !location) return NextResponse.json({ error: "Work name and location are required" }, { status: 400 });
  if (isNaN(startAt)) return NextResponse.json({ error: "Enter a valid start date & time" }, { status: 400 });

  // merge duplicates of the same item and validate quantities
  const wanted = new Map();
  for (const it of body.items || []) {
    const qty = Number(it.quantity);
    if (!it.itemId || !Number.isInteger(qty) || qty < 1) {
      return NextResponse.json({ error: "Each item needs a whole-number quantity of at least 1" }, { status: 400 });
    }
    wanted.set(it.itemId, (wanted.get(it.itemId) || 0) + qty);
  }

  const staffIds = [...new Set(body.staffIds || [])];
  const vehicleIds = [...new Set(body.vehicleIds || [])];

  const workRef = adminDb.collection("works").doc();

  try {
    await adminDb.runTransaction(async (tx) => {
      // 1) READ all items first (Firestore requires reads before writes)
      const refs = [...wanted.keys()].map((id) => adminDb.collection("items").doc(id));
      const snaps = refs.length ? await tx.getAll(...refs) : [];

      // workers must exist in the users collection
      const staffSnaps = staffIds.length
        ? await tx.getAll(...staffIds.map((id) => adminDb.collection("users").doc(id)))
        : [];
      const staff = staffSnaps.map((s) => {
        if (!s.exists) throw new Error("A selected worker no longer exists");
        return { id: s.id, name: s.data().name };
      });

      // vehicles must exist in the vehicles collection
      const vehicleSnaps = vehicleIds.length
        ? await tx.getAll(...vehicleIds.map((id) => adminDb.collection("vehicles").doc(id)))
        : [];
      const vehicles = vehicleSnaps.map((s) => {
        if (!s.exists) throw new Error("A selected vehicle no longer exists");
        return { id: s.id, name: s.data().name, number: s.data().number };
      });

      const lines = [];
      snaps.forEach((s) => {
        const qty = wanted.get(s.id);
        if (!s.exists) throw new Error("An item you selected no longer exists");
        const { name: itemName, quantity: stock } = s.data();
        if (stock < qty) throw new Error(`Not enough "${itemName}" in stock (available: ${stock}, requested: ${qty})`);
        lines.push({ itemId: s.id, name: itemName, quantity: qty, stockBefore: stock });
      });

      // 2) WRITE: deduct stock + create the work
      lines.forEach((l) => tx.update(adminDb.collection("items").doc(l.itemId), { quantity: l.stockBefore - l.quantity }));
      tx.set(workRef, {
        name,
        venueType,
        location,
        startAt,
        contactName: body.contactName?.trim() || "",
        contactPhone: body.contactPhone?.trim() || "",
        items: lines.map(({ itemId, name, quantity }) => ({ itemId, name, quantity })),
        staff, // [{ id, name }] - the staff website can read/extend this later
        vehicles, // [{ id, name, number }]
        status: "ongoing",
        createdBy: admin.uid,
        createdAt: new Date(),
      });
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  return NextResponse.json({ id: workRef.id }, { status: 201 });
}