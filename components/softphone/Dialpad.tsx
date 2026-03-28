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
      {/* Display */}
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter number..."
          className="w-full bg-navy-950 border border-navy-600 rounded-xl px-4 py-3 text-white text-xl font-mono text-center tracking-widest focus:outline-none focus:border-accent transition-colors"
        />
        {value && (
          <button
            onClick={() => handleKey("backspace")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
          >
            <Delete className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-2">
        {KEYS.map(([digit, letters]) => (
          <button
            key={digit}
            onClick={() => handleKey(digit)}
            className="flex flex-col items-center justify-center py-3 rounded-xl bg-navy-800 hover:bg-navy-700 border border-navy-600 hover:border-accent/30 transition-all duration-150 group"
          >
            <span className="text-white text-lg font-semibold leading-none group-hover:text-accent transition-colors">
              {digit}
            </span>
            {letters && (
              <span className="text-slate-500 text-[9px] font-medium tracking-widest mt-0.5">
                {letters}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
