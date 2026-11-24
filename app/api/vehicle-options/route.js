import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { verifyAdmin } from "@/lib/verifyAdmin";

// All vehicles (from the Vehicles page) for the "select vehicles" box in Create Work.
export async function GET(request) {
  if (!(await verifyAdmin(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const snap = await adminDb.collection("vehicles").orderBy("name").limit(500).get();
  const vehicles = snap.docs.map((d) => ({
    id: d.id,
    name: d.data().name,
    number: d.data().number,
    type: d.data().type,
  }));
  return NextResponse.json({ vehicles });
}