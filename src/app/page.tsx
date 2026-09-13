import Link from 'next/link';
import {
  QrCode,
  Store,
  ShieldAlert,
  Coffee,
  ArrowRight,
  Zap,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export default function HomePortal() {
  return (
    <div className="min-h-screen bg-[#0A0F1D] text-[#E2E8F0] flex flex-col justify-between p-4 md:p-8">
      {/* Top Banner */}
      <header className="max-w-6xl mx-auto w-full flex items-center justify-between py-4 border-b border-[#1E293B]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Coffee className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-plex-sans text-2xl font-bold tracking-wide text-white flex items-center gap-2">
              THE CYBER COFFEE
              <span className="text-xs font-plex-mono px-2 py-0.5 rounded bg-cyan-500/10 text-[#00E5FF] border border-cyan-500/30">
                SOC v2.6
              </span>
            </h1>
            <p className="text-xs text-[#64748B] font-plex-mono">
              QR Order System & SIEM Security Operations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-plex-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            SYSTEM HEALTHY
          </span>
        </div>
      </header>

      {/* Hero Core */}
      <main className="max-w-6xl mx-auto w-full py-12 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 text-[#00E5FF] border border-cyan-500/30 text-sm font-medium mb-6">
          <Zap className="w-4 h-4" />
          <span>Kiến trúc Bảo mật 2 Lớp & VietQR NAPAS Realtime</span>
        </div>

        <h2 className="font-plex-sans text-4xl md:text-6xl font-bold text-white max-w-4xl tracking-tight leading-tight">
          Hệ Thống Đặt Đồ Uống Qua Mã QR &{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00E5FF] to-blue-400">
            Trung Tâm Điều Hành SOC
          </span>
        </h2>

        <p className="mt-4 text-base md:text-lg text-[#64748B] max-w-2xl font-plex-sans">
          Lựa chọn phân hệ để kiểm thử luồng nghiệp vụ từ trải nghiệm đặt món
          Mobile-first tại bàn, điều hành Quán trên Tablet cho đến giám sát an
          ninh SIEM/SOC trên Desktop.
        </p>

        {/* 3 Main Role Portals */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 w-full">
          {/* Portal 1: Customer Web App */}
          <Link
            href="/t/table-01-token"
            className="group siem-panel-interactive rounded-2xl p-6 text-left flex flex-col justify-between border border-[#1E293B] hover:border-[#00E5FF]/50"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-[#00E5FF] mb-4 group-hover:scale-110 transition-transform">
                <QrCode className="w-6 h-6" />
              </div>
              <span className="text-xs font-plex-mono uppercase tracking-widest text-[#00E5FF]">
                Phân Hệ 1 (Mobile-First)
              </span>
              <h3 className="font-plex-sans text-2xl font-bold text-white mt-1">
                Customer QR App
              </h3>
              <p className="text-sm text-[#64748B] mt-2 font-plex-sans">
                Khách quét QR tại Bàn 01, xem menu đồ uống kèm Ghi chú, đặt
                đơn Pay-now (VietQR) hoặc Pay-later (Bảo vệ 2 lớp).
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-[#1E293B] flex items-center justify-between text-xs font-plex-mono text-cyan-400">
              <span>BÀN 01 (TABLE-01-TOKEN)</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Portal 2: Store Owner/Staff Dashboard (Mobile & Tablet) */}
          <Link
            href="/orders"
            className="group siem-panel-interactive rounded-2xl p-6 text-left flex flex-col justify-between border border-[#1E293B] hover:border-[#FFB800]/50"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-110 transition-transform">
                <Store className="w-6 h-6" />
              </div>
              <span className="text-xs font-plex-mono uppercase tracking-widest text-amber-400">
                Phân Hệ 2 (Mobile & Tablet)
              </span>
              <h3 className="font-plex-sans text-2xl font-bold text-white mt-1">
                Owner/Staff Dashboard
              </h3>
              <p className="text-sm text-[#64748B] mt-2 font-plex-sans">
                Quản lý đơn theo Kanban Cards & Sơ đồ Bàn Table Map. Tích hợp
                thanh bật/tắt Âm báo Realtime khi có đơn mới.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-[#1E293B] flex items-center justify-between text-xs font-plex-mono text-amber-400">
              <span>VÀO BẢNG ĐIỀU KHIỂN QUÁN</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Portal 3: Super Admin SIEM / SOC Dashboard */}
          <Link
            href="/admin"
            className="group siem-panel-interactive rounded-2xl p-6 text-left flex flex-col justify-between border border-[#1E293B] hover:border-red-500/50"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400 mb-4 group-hover:scale-110 transition-transform">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <span className="text-xs font-plex-mono uppercase tracking-widest text-red-400">
                Phân Hệ 3 (Desktop SOC SIEM)
              </span>
              <h3 className="font-plex-sans text-2xl font-bold text-white mt-1">
                Super Admin SOC
              </h3>
              <p className="text-sm text-[#64748B] mt-2 font-plex-sans">
                Trung tâm Điều hành An ninh (SOC) theo dõi nhật ký chặn Rate-limit,
                mức trần đơn nợ, cấu hình VietQR & Doanh thu.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-[#1E293B] flex items-center justify-between text-xs font-plex-mono text-red-400">
              <span>TRUNG TÂM SOC SIEM</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>

        {/* Quick Table Selector for Testing */}
        <div className="mt-12 w-full bg-slate-900/60 border border-[#1E293B] rounded-2xl p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-left">
              <h4 className="font-plex-sans text-lg font-bold text-white flex items-center gap-2">
                <QrCode className="w-5 h-5 text-[#00E5FF]" />
                Chọn nhanh Bàn khác để Test Đơn hàng (Khách hàng)
              </h4>
              <p className="text-xs text-[#64748B] font-plex-mono mt-1">
                Giúp bạn test kịch bản nhiều bàn đặt món song song trên hệ
                thống.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                <Link
                  key={num}
                  href={`/t/table-0${num}-token`}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-cyan-500/20 text-xs font-plex-mono text-slate-300 hover:text-[#00E5FF] border border-slate-700 hover:border-cyan-500/50 transition-all"
                >
                  Bàn 0{num}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="max-w-6xl mx-auto w-full py-6 border-t border-[#1E293B] flex flex-col md:flex-row items-center justify-between text-xs text-[#64748B] font-plex-mono">
        <div>THE CYBER COFFEE SOC — QR ORDERING SAAS</div>
        <div className="flex items-center gap-4 mt-2 md:mt-0">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            2-Layer Pay-Later Defense
          </span>
          <span className="flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-[#00E5FF]" />
            NAPAS Dynamic VietQR
          </span>
        </div>
      </footer>
    </div>
  );
}
