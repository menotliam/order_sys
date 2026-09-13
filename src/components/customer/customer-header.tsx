'use client';

import Link from 'next/link';
import { Coffee, Utensils, ClipboardList, Home } from 'lucide-react';

interface CustomerHeaderProps {
  storeName: string;
  tableNumber: string;
  activeOrderCount?: number;
}

export function CustomerHeader({
  storeName,
  tableNumber,
  activeOrderCount = 0,
}: CustomerHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 py-3">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Link
            href="/"
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20"
          >
            <Coffee className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-plex-sans text-lg font-bold text-white leading-tight">
              {storeName}
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 text-xs font-plex-mono border border-cyan-500/30">
                <Utensils className="w-3 h-3" />
                {tableNumber}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/orders"
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-plex-mono flex items-center gap-1.5"
          >
            <ClipboardList className="w-4 h-4 text-cyan-400" />
            <span>Đơn Của Bàn</span>
            {activeOrderCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 font-bold flex items-center justify-center text-[10px]">
                {activeOrderCount}
              </span>
            )}
          </Link>
          <Link
            href="/"
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            title="Vào Trang Chủ Nền Tảng"
          >
            <Home className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
