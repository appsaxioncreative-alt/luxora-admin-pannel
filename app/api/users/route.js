import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { verifyAdmin } from "@/lib/verifyAdmin";

const PAGE = 20;

export async function GET(request) {
  if (!(await verifyAdmin(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const after = new URL(request.url).searchParams.get("after");
  let q = adminDb.collection("users").orderBy("createdAt", "desc").limit(PAGE);
  if (after) q = q.startAfter(new Date(after));

  const snap = await q.get();
  const users = snap.docs.map((d) => {
    const data = d.data();
    return { id: d.id, name: data.name, email: data.email, createdAt: data.createdAt.toDate().toISOString() };
  });
  const next = users.length === PAGE ? users[users.length - 1].createdAt : null;
  return NextResponse.json({ users, next });
}

export async function POST(request) {
  if (!(await verifyAdmin(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, email, password } = await request.json();
  if (!name?.trim() || !email?.trim() || !password) {
    return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  try {
    const record = await adminAuth.createUser({ email: email.trim(), password, displayName: name.trim() });
    await adminDb.collection("users").doc(record.uid).set({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      createdAt: new Date(),
    });
    return NextResponse.json({ id: record.uid }, { status: 201 });
  } catch (e) {
    const msg = e.code === "auth/email-already-exists" ? "That email is already in use" : e.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
