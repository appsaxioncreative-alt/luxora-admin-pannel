import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { verifyAdmin } from "@/lib/verifyAdmin";

const ROLES = ["admin", "staff", "user"];

export async function PATCH(request, { params }) {
  const caller = await verifyAdmin(request);
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { uid } = await params;
  const { role } = await request.json();

  if (!ROLES.includes(role)) return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  if (uid === caller.uid && role !== "admin") {
    return NextResponse.json({ error: "You can't remove your own admin access" }, { status: 400 });
  }

  try {
    await adminAuth.setCustomUserClaims(uid, { admin: role === "admin", staff: role === "staff" });
    // keep the Firestore profile in sync (only if the user has one)
    const ref = adminDb.collection("users").doc(uid);
    if ((await ref.get()).exists) await ref.update({ role });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}