"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
//   { label: "Sales CRM", href: "/crm", icon: "leaderboard" },
  { label: "Clients", href: "/clients", icon: "group" },
  { label: "Content Calendar", href: "/calendar", icon: "calendar_month" },
  { label: "Google Ads", href: "/google-ads", icon: "ads_click" },
  { label: "Meta Ads", href: "/meta-ads", icon: "campaign" },
  { label: "SEO", href: "/seo", icon: "drive_file_rename" },
  { label: "Design Requests", href: "/design-requests", icon: "palette" },
  { label: "Tasks", href: "/tasks", icon: "assignment" },
  { label: "Invoices", href: "/invoices", icon: "receipt_long" },
  { label: "Agreements", href: "/agreements", icon: "description" },
  { label: "Meeting Notes", href: "/notes", icon: "event_note" },
  { label: "Reports", href: "/reports", icon: "bar_chart" },
  { label: "SOP Library", href: "/sop", icon: "menu_book" },
  { label: "HR", href: "/hr", icon: "badge" },
  { label: "Settings", href: "/settings", icon: "settings", mtAuto: true },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col h-full fixed left-0 top-0 w-[260px] bg-[#1A1A1A] z-50 ">
      {/* Brand Logo Area */}
      <div className="h-16 flex items-center px-6 mb-4">
        <span className="font-headline-md text-headline-md font-bold text-on-primary-container text-white">
          Agency OS
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto w-full px-0 py-2 space-y-1 scrollbar-none [&::-webkit-scrollbar]:hidden">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center px-6 py-3 border-l-4 transition-all cursor-pointer active:scale-95 ${
                item.mtAuto ? "mt-auto" : ""
              } ${
                isActive
                  ? "border-primary text-on-primary-container bg-white/10 text-white font-semibold"
                  : "border-transparent text-secondary-fixed-dim opacity-60 hover:bg-white/10 hover:opacity-100 text-gray-300"
              }`}
            >
              <span className="material-symbols-outlined mr-4 opacity-100">
                {item.icon}
              </span>
              <span className="font-label-md text-label-md">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
