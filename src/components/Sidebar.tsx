"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Archive, CalendarDays, BarChart3, Settings } from "lucide-react";

import { Badge } from "@/components/ui/badge";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const menuItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Active Employees", href: "/employees", icon: Users },
  { label: "Archived Employees", href: "/employees/archived", icon: Archive },
  { label: "Past Attendance", href: "/attendance/past", icon: CalendarDays },
  { label: "Statistics", href: "/statistics", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm lg:hidden z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-16 bottom-0 w-72 bg-background border-r border-muted overflow-y-auto transition-transform duration-300 ease-out z-40 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 space-y-1 pt-6">
          {/* Section label */}
          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] px-4 pb-3">
            Navigation
          </p>

          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`group flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                  isActive
                    ? "bg-primary-foreground/20"
                    : "bg-muted/50 group-hover:bg-muted"
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`font-bold text-sm ${isActive ? "text-primary-foreground" : ""}`}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-foreground/60" />
                )}
              </Link>
            );
          })}
        </div>

      </aside>
    </>
  );
}
