import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { verifyAdmin } from "@/lib/verifyAdmin";

export async function DELETE(request, { params }) {
  const admin = await verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { uid } = await params;
  if (uid === admin.uid) return NextResponse.json({ error: "You can't delete yourself" }, { status: 400 });

  try {
    await adminAuth.deleteUser(uid);
  } catch (e) {
    if (e.code !== "auth/user-not-found") return NextResponse.json({ error: e.message }, { status: 400 });
  }
  await adminDb.collection("users").doc(uid).delete();
  return NextResponse.json({ ok: true });
}
