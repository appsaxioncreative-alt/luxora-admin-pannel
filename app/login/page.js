"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user && isAdmin) router.replace("/dashboard");
  }, [user, isAdmin, loading, router]);

  async function submit(e) {
    e.preventDefault();
    setError(""); setBusy(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const t = await cred.user.getIdTokenResult(true);
      if (t.claims.admin !== true) {
        await signOut(auth);
        setError("This account is not an admin.");
      }
    } catch {
      setError("Invalid email or password.");
    }
    setBusy(false);
  }

  return (
    <div className="center">
      <form className="card login-card" onSubmit={submit}>
        <h1>Admin Panel</h1>
        {error && <div className="msg err">{error}</div>}
        <div className="field">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button className="btn" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
      </form>
    </div>
  );
}
