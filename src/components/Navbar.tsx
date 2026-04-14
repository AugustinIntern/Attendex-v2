"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Menu, LogOut, ChevronDown } from "lucide-react";

interface NavbarProps {
  onMenuToggle?: () => void;
}

export default function Navbar({ onMenuToggle }: NavbarProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    router.push("/login");
  };

  const getInitials = (email: string) => {
    return email
      .split("@")[0]
      .split(".")
      .map((part) => part.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2);
  };

  return (
    <nav className="bg-background/80 backdrop-blur-xl border-b border-muted sticky top-0 z-50">
      <div className="px-4 sm:px-8 py-4">
        <div className="flex items-center justify-between gap-4">

          {/* Left: Menu toggle & Logo */}
          <div className="flex items-center gap-4">
            <Button
              onClick={onMenuToggle}
              variant="ghost"
              size="icon"
              className="w-11 h-11 rounded-xl hover:bg-muted/50"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5" />
            </Button>

            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="w-56 flex items-center justify-start group-hover:scale-105 transition-transform overflow-hidden">
                <img src="/AttendEx_Logo.svg" alt="AttendEX Logo" className="w-full h-auto object-contain" />
              </div>
            </Link>
          </div>

          {/* Right: User Menu */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 px-4 py-2 rounded-2xl border border-muted bg-muted/20 hover:bg-muted/40 transition-all"
              >
                <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-md shadow-primary/20">
                  <span className="text-primary-foreground text-xs font-black">
                    {user ? getInitials(user.email) : "??"}
                  </span>
                </div>
                <div className="hidden sm:flex flex-col items-start">
                  <span className="text-xs font-black text-foreground tracking-tight leading-none">
                    {user?.admin ? "Administrator" : "User"}
                  </span>
                  <span className="text-[9px] font-bold text-muted-foreground leading-none mt-0.5 max-w-[120px] truncate">
                    {user?.email}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-3 w-64 bg-background rounded-[1.5rem] shadow-2xl shadow-black/20 border border-muted overflow-hidden z-50">
                  <div className="p-5 border-b border-muted bg-muted/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                        <span className="text-primary-foreground font-black text-sm">
                          {user ? getInitials(user.email) : "??"}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-black text-foreground">
                          {user?.admin ? "Administrator" : "User"}
                        </p>
                        <p className="text-[10px] font-bold text-muted-foreground truncate max-w-[160px]">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                    {user?.admin && (
                      <Badge className="mt-3 bg-primary/10 text-primary border-none font-black text-[9px] tracking-widest rounded-lg px-3">
                        ADMIN_CLEARANCE
                      </Badge>
                    )}
                  </div>
                  <div className="p-2">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
