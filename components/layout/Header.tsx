"use client";

import { Bell, Search, User } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="h-16 bg-navy-900/80 backdrop-blur border-b border-navy-700 flex items-center justify-between px-6 sticky top-0 z-10">
      <div>
        <h1 className="text-white font-semibold text-lg leading-none">{title}</h1>
        {subtitle && (
          <p className="text-slate-500 text-xs mt-0.5">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button className="flex items-center gap-2 bg-navy-800 hover:bg-navy-700 border border-navy-600 rounded-lg px-3 py-1.5 text-slate-400 text-sm transition-colors">
          <Search className="w-3.5 h-3.5" />
          <span>Search</span>
          <kbd className="ml-1 text-xs bg-navy-700 px-1.5 py-0.5 rounded text-slate-500">
            ⌘K
          </kbd>
        </button>

        <button className="relative p-2 rounded-lg hover:bg-navy-800 text-slate-400 hover:text-white transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-accent" />
        </button>

        <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-navy-800 transition-colors">
          <div className="w-7 h-7 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-accent" />
          </div>
        </button>
      </div>
    </header>
  );
}
