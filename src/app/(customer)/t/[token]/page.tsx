import Link from 'next/link';
import { Coffee, Utensils, ShieldCheck, ArrowRight, QrCode } from 'lucide-react';
import { resolveTableAction } from '@/actions/admin-actions';
import { notFound } from 'next/navigation';

interface TableLandingProps {
  params: Promise<{ token: string }>;
}

export default async function TableLandingPage({ params }: TableLandingProps) {
  const { token } = await params;

  // Resolve server-side. An unknown token is refused rather than silently
  // falling back to table 01, and the attempt is logged as a scan probe.
  const resolved = await resolveTableAction(token);
  if (!resolved) notFound();

  const { store, table } = resolved;

  return (
    <div className="min-h-screen bg-[#0A0F1D] text-white flex flex-col justify-between p-6">
      {/* Top logo */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Coffee className="w-5 h-5 text-white" />
          </div>
          <span className="font-plex-sans font-bold text-lg">
            {store.name}
          </span>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-plex-mono text-xs">
          <QrCode className="w-3.5 h-3.5" />
          <span>QR SESSION ACTIVE</span>
        </span>
      </div>

      {/* Hero Welcome */}
      <div className="max-w-md mx-auto my-auto text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto shadow-2xl shadow-cyan-500/15">
          <Utensils className="w-10 h-10" />
        </div>

        <div>
          <span className="text-xs font-plex-mono uppercase tracking-widest text-cyan-400 block mb-2">
            Chào mừng bạn đến với
          </span>
          <h1 className="font-plex-sans text-4xl font-bold text-white leading-tight">
            {store.name}
          </h1>
          <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 font-plex-mono text-base font-bold text-cyan-400">
            <span>VỊ TRÍ: {table.table_number.toUpperCase()}</span>
          </div>
        </div>

        <p className="text-sm text-slate-400 font-plex-sans leading-relaxed">
          Quét mã QR hợp lệ. Bạn có thể xem menu đồ uống, ghi chú tuỳ chọn độ
          đọt/đá và chọn thanh toán ngay qua VietQR hoặc thanh toán sau.
        </p>

        <div className="pt-4">
          <Link
            href={`/menu?tableToken=${token}`}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-plex-sans text-xl font-bold flex items-center justify-center gap-3 shadow-xl shadow-cyan-500/25 transition-all"
          >
            <span>BẮT ĐẦU GỌI MÓN</span>
            <ArrowRight className="w-6 h-6" />
          </Link>
        </div>
      </div>

      {/* Footer security badge */}
      <div className="text-center text-xs text-slate-500 font-plex-mono flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-cyan-400" />
        <span>Bảo vệ bởi SOC Rate-Limit & NAPAS VietQR</span>
      </div>
    </div>
  );
}
