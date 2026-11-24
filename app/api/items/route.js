import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { verifyAdmin } from "@/lib/verifyAdmin";

const PAGE = 20;

export async function GET(request) {
  if (!(await verifyAdmin(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const after = new URL(request.url).searchParams.get("after");
  let q = adminDb.collection("items").orderBy("createdAt", "desc").limit(PAGE);
  if (after) q = q.startAfter(new Date(after));

  const snap = await q.get();
  const items = snap.docs.map((d) => {
    const data = d.data();
    return { id: d.id, name: data.name, quantity: data.quantity, createdAt: data.createdAt.toDate().toISOString() };
  });
  const next = items.length === PAGE ? items[items.length - 1].createdAt : null;
  return NextResponse.json({ items, next });
}

export async function POST(request) {
  if (!(await verifyAdmin(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, quantity } = await request.json();
  const qty = Number(quantity);
  if (!name?.trim() || !Number.isInteger(qty) || qty < 0) {
    return NextResponse.json({ error: "Enter a name and a whole-number quantity" }, { status: 400 });
  }
  const ref = await adminDb.collection("items").add({ name: name.trim(), quantity: qty, createdAt: new Date() });
  return NextResponse.json({ id: ref.id }, { status: 201 });
}
