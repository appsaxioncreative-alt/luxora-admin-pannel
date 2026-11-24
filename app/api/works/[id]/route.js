import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";
import { verifyAdmin } from "@/lib/verifyAdmin";

// Change a work's status: "completed" or "cancelled".
// Either one returns the used items back to inventory (equipment comes back
// from the site). Only an "ongoing" work can be closed, so stock can never
// be returned twice.
export async function PATCH(request, { params }) {
  if (!(await verifyAdmin(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { status } = await request.json();
  if (!["completed", "cancelled"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const workRef = adminDb.collection("works").doc(id);
  try {
    await adminDb.runTransaction(async (tx) => {
      const work = await tx.get(workRef);
      if (!work.exists) throw new Error("Work not found");
      if (work.data().status !== "ongoing") throw new Error("This work is already closed");

      const items = work.data().items || [];
      const itemSnaps = items.length
        ? await tx.getAll(...items.map((i) => adminDb.collection("items").doc(i.itemId)))
        : [];

      itemSnaps.forEach((s, idx) => {
        if (s.exists) tx.update(s.ref, { quantity: FieldValue.increment(items[idx].quantity) });
      });
      tx.update(workRef, { status, closedAt: new Date() });
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}