"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/login/context/AuthContext";

// Wraps an admin-only page. Team members land here only via a stale bookmark
// or typed URL (the nav link is already hidden for them) and get bounced to
// the Clients page instead of seeing the page render.
export default function RequireAdmin({ children }) {
  const { isAdmin, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !isAdmin) {
      router.replace("/clients");
    }
  }, [user, isAdmin, router]);

  if (!user || !isAdmin) {
    return null;
  }

  return children;
}
