"use client";

import React from "react";
import SearchBar from "@/components/dashboard/SearchBar";
import DashboardShell from "@/components/dashboard/DashboardShell";
import RequireAdmin from "@/components/auth/RequireAdmin";

export default function DashboardPage() {
  return (
    <RequireAdmin>
      <header className="h-16 w-full sticky top-0 z-40 bg-surface dark:bg-surface border-b border-outline-variant shadow-sm flex justify-between items-center px-gutter">
        <button className="md:hidden text-primary hover:text-primary transition-colors cursor-pointer active:opacity-80 p-2">
          <span className="material-symbols-outlined">menu</span>
        </button>

        <div className="flex-1 flex items-center ml-2 md:ml-0">
          <SearchBar />
        </div>
      </header>

      <main className="flex-1 p-gutter md:p-container-margin w-full max-w-[1440px] mx-auto">
        <div className="mb-stack-lg">
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">
            CEO Dashboard
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            Overview of agency performance and operations.
          </p>
        </div>

        <DashboardShell />
      </main>
    </RequireAdmin>
  );
}
