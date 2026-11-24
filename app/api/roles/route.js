import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { verifyAdmin } from "@/lib/verifyAdmin";

export async function GET(request) {
  if (!(await verifyAdmin(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pageToken = new URL(request.url).searchParams.get("pageToken") || undefined;
  const result = await adminAuth.listUsers(50, pageToken);

  const users = result.users.map((u) => ({
    id: u.uid,
    name: u.displayName || "",
    email: u.email,
    role: u.customClaims?.admin ? "admin" : u.customClaims?.staff ? "staff" : "user",
  }));

  return NextResponse.json({ users, next: result.pageToken || null });
}