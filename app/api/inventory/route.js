import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { verifyAdmin } from "@/lib/verifyAdmin";

// Lightweight list of inventory items (id, name, quantity) used by the
// "create work" item picker. The picker filters this list as you type.
export async function GET(request) {
  if (!(await verifyAdmin(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const snap = await adminDb.collection("items").orderBy("name").limit(500).get();
  const items = snap.docs.map((d) => ({ id: d.id, name: d.data().name, quantity: d.data().quantity }));
  return NextResponse.json({ items });
}