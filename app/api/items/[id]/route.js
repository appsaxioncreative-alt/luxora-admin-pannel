import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { verifyAdmin } from "@/lib/verifyAdmin";

export async function PATCH(request, { params }) {
  if (!(await verifyAdmin(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const qty = Number((await request.json()).quantity);
  if (!Number.isInteger(qty) || qty < 0) return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
  await adminDb.collection("items").doc(id).update({ quantity: qty });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request, { params }) {
  if (!(await verifyAdmin(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await adminDb.collection("items").doc(id).delete();
  return NextResponse.json({ ok: true });
}
