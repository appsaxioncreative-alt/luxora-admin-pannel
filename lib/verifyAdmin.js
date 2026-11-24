import { adminAuth } from "./firebaseAdmin";

// Returns the decoded token if the caller is an admin, otherwise null.
export async function verifyAdmin(request) {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return decoded.admin === true ? decoded : null;
  } catch {
    return null;
  }
}
