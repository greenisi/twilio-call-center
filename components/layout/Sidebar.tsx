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
  UserCheck,
  BarChart2,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/softphone", label: "Softphone", icon: PhoneCall },
  { href: "/calls", label: "Call Logs", icon: Phone },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/leads", label: "Leads", icon: UserCheck },
  { href: "/campaigns", label: "Campaigns", icon: BarChart2 },
  { href: "/sms", label: "SMS Demo", icon: MessageSquare },
  { href: "/monitor", label: "Live Monitor", icon: Radio },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-navy-900 border-r border-navy-700 flex-col h-screen sticky top-0">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-navy-700">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <PhoneIncoming className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-none">CallCenter</p>
            <p className="text-slate-500 text-xs mt-0.5">Pro Dashboard</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  active
                    ? "bg-accent/10 text-accent font-medium"
                    : "text-slate-400 hover:text-white hover:bg-navy-800"
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="px-6 py-4 border-t border-navy-700">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            System Online
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-navy-900 border-t border-navy-700 px-2 pb-safe">
        <div className="flex items-center justify-around py-2">
          {navItems.slice(0, 5).map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center gap-1 px-2 py-2 rounded-lg min-w-[56px] transition-colors",
                  active
                    ? "text-accent"
                    : "text-slate-500"
                )}
              >
                <Icon className="w-6 h-6" />
                <span className="text-[10px] font-medium leading-none">{label.split(" ")[0]}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
