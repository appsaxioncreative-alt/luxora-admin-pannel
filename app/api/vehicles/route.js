import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { verifyAdmin } from "@/lib/verifyAdmin";

const PAGE = 20;
const TYPES = ["Car", "Bike", "Van", "Truck", "Bus", "Other"];

export async function GET(request) {
  if (!(await verifyAdmin(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const after = new URL(request.url).searchParams.get("after");
  let q = adminDb.collection("vehicles").orderBy("createdAt", "desc").limit(PAGE);
  if (after) q = q.startAfter(new Date(after));

  const snap = await q.get();
  const vehicles = snap.docs.map((d) => {
    const v = d.data();
    return {
      id: d.id,
      name: v.name,
      number: v.number,
      type: v.type,
      driver: v.driver || "",
      notes: v.notes || "",
      createdAt: v.createdAt.toDate().toISOString(),
    };
  });
  const next = vehicles.length === PAGE ? vehicles[vehicles.length - 1].createdAt : null;
  return NextResponse.json({ vehicles, next });
}

export async function POST(request) {
  if (!(await verifyAdmin(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const name = body.name?.trim();
  const number = body.number?.trim().toUpperCase().replace(/\s+/g, " ");
  const type = TYPES.includes(body.type) ? body.type : "Other";

  if (!name || !number) {
    return NextResponse.json({ error: "Vehicle name and number are required" }, { status: 400 });
  }

  // vehicle numbers must be unique
  const dup = await adminDb.collection("vehicles").where("number", "==", number).limit(1).get();
  if (!dup.empty) {
    return NextResponse.json({ error: `Vehicle ${number} already exists` }, { status: 400 });
  }

  const ref = await adminDb.collection("vehicles").add({
    name,
    number,
    type,
    driver: body.driver?.trim() || "",
    notes: body.notes?.trim() || "",
    createdAt: new Date(),
  });
  return NextResponse.json({ id: ref.id }, { status: 201 });
}