"use client";

import { Delete } from "lucide-react";

const KEYS = [
  ["1", ""], ["2", "ABC"], ["3", "DEF"],
  ["4", "GHI"], ["5", "JKL"], ["6", "MNO"],
  ["7", "PQRS"], ["8", "TUV"], ["9", "WXYZ"],
  ["*", ""], ["0", "+"], ["#", ""],
];

interface DialpadProps {
  value: string;
  onChange: (val: string) => void;
}

export function Dialpad({ value, onChange }: DialpadProps) {
  const handleKey = (key: string) => {
    if (key === "backspace") {
      onChange(value.slice(0, -1));
    } else {
      onChange(value + key);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter number..."
          className="w-full bg-navy-950 border border-navy-600 rounded-xl px-4 py-4 md:py-3 text-white text-2xl md:text-xl font-mono text-center tracking-widest focus:outline-none focus:border-accent transition-colors"
        />
        {value && (
          <button
            onClick={() => handleKey("backspace")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors p-2"
          >
            <Delete className="w-5 h-5 md:w-4 md:h-4" />
          </button>
        )}
      </div>
      <div className="grid grid-cols-3 gap-3 md:gap-2">
        {KEYS.map(([digit, letters]) => (
          <button
            key={digit}
            onClick={() => handleKey(digit)}
            className="flex flex-col items-center justify-center py-5 md:py-3 rounded-xl bg-navy-800 hover:bg-navy-700 border border-navy-600 hover:border-accent/30 transition-all duration-150 group active:scale-95 min-h-[64px]"
          >
            <span className="text-white text-2xl md:text-lg font-semibold leading-none group-hover:text-accent transition-colors">
              {digit}
            </span>
            {letters && (
              <span className="text-slate-500 text-[10px] md:text-[9px] font-medium tracking-widest mt-1 md:mt-0.5">
                {letters}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
