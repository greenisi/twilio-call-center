"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Phone,
  PhoneCall,
  PhoneIncoming,
  Users,
  Radio,
  Settings,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/softphone", label: "Softphone", icon: PhoneCall },
  { href: "/calls", label: "Call Logs", icon: Phone },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/monitor", label: "Live Monitor", icon: Radio },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-navy-900 border-r border-navy-700 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-navy-700">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
          <PhoneIncoming className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-white font-semibold text-sm leading-none">CallCenter</p>
          <p className="text-slate-500 text-xs mt-0.5">Pro Dashboard</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                active
                  ? "bg-accent/15 text-accent border border-accent/20"
                  : "text-slate-400 hover:bg-navy-800 hover:text-white"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Status */}
      <div className="px-4 py-4 border-t border-navy-700">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-navy-800">
          <Activity className="w-3.5 h-3.5 text-success" />
          <span className="text-xs text-slate-400">System Online</span>
          <span className="ml-auto w-2 h-2 rounded-full bg-success animate-pulse" />
        </div>
      </div>
    </aside>
  );
}
