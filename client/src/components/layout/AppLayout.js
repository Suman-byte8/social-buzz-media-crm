"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./sidebar";

export default function AppLayout({ children }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="text-on-surface antialiased overflow-x-hidden min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen md:ml-[260px] min-w-0">
        {children}
      </div>
    </div>
  );
}