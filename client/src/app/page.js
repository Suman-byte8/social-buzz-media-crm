"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <div className="flex flex-1 items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">
          progress_activity
        </span>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Redirecting to Dashboard...
        </p>
      </div>
    </div>
  );
}
