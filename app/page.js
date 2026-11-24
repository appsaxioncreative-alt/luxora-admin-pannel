"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading) router.replace(user && isAdmin ? "/dashboard" : "/login");
  }, [user, isAdmin, loading, router]);
  return <div className="center spinner">Loading…</div>;
}
