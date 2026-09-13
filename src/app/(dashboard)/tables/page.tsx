'use client';

import { useState, useEffect, useTransition } from 'react';
import { getStoreConfigAction } from '@/actions/admin-actions';
import { CafeTable, Store } from '@/types/database';
import { QrCode, ExternalLink, Printer, Utensils } from 'lucide-react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';

export default function StaffTablesPage() {
  const [tables, setTables] = useState<CafeTable[]>([]);
  const [store, setStore] = useState<Store | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const res = await getStoreConfigAction();
      setTables(res.tables);
      setStore(res.store);
    });
  }, []);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 border border-[#1E293B] p-4 rounded-2xl">
        <div>
          <h2 className="font-plex-sans text-2xl font-bold text-white flex items-center gap-2">
            <QrCode className="w-6 h-6 text-emerald-400" />
            Mã QR 8 Bàn Phục Vụ (Table QR Codes)
          </h2>
          <p className="text-xs text-slate-400 font-plex-sans mt-0.5">
            Quét QR trên bàn để kiểm thử ứng dụng Khách hàng hoặc in dán tại
            bàn cafe.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-plex-mono flex items-center gap-2 border border-slate-700 transition-all"
        >
          <Printer className="w-4 h-4" />
          <span>In Toàn Bộ Mã QR</span>
        </button>
      </div>

      {/* Grid of 8 Table QR Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {tables.map((t) => {
          const qrUrl = `${origin}/t/${t.qr_token}`;

          return (
            <div
              key={t.id}
              className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 flex flex-col items-center justify-between text-center hover:border-emerald-500/50 transition-all"
            >
              <div className="w-full">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-plex-sans text-2xl font-bold text-white">
                    {t.table_number}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-plex-mono text-[10px] border border-emerald-500/30">
                    ID: {t.qr_token.split('-')[1]}
                  </span>
                </div>

                {/* QR Code Graphic */}
                <div className="bg-white p-4 rounded-2xl inline-block shadow-lg border-2 border-emerald-500/20">
                  <QRCodeSVG value={qrUrl} size={130} level="M" />
                </div>

                <div className="mt-4 font-plex-mono text-xs text-slate-400 truncate">
                  {t.qr_token}
                </div>
              </div>

              {/* Action */}
              <div className="mt-5 pt-4 border-t border-slate-800 w-full">
                <Link
                  href={`/t/${t.qr_token}`}
                  target="_blank"
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-plex-sans font-bold text-sm flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/15 transition-all"
                >
                  <span>Mở Giao Diện Bàn Này</span>
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
