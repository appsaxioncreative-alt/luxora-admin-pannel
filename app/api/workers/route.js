import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { verifyAdmin } from "@/lib/verifyAdmin";

// List of workers (the people added on the Users page) for the
// "assign workers" box in the Create Work form.
export async function GET(request) {
  if (!(await verifyAdmin(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const snap = await adminDb.collection("users").orderBy("name").limit(500).get();
  const workers = snap.docs.map((d) => ({ id: d.id, name: d.data().name, email: d.data().email }));
  return NextResponse.json({ workers });
}