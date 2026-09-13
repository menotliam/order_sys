import Link from 'next/link';
import {
  Store,
  ClipboardList,
  Utensils,
  QrCode,
  ShieldAlert,
  Home,
  LogOut,
} from 'lucide-react';
import { AudioAlertToggle } from '@/components/dashboard/audio-toggle';
import { getStoreConfigAction } from '@/actions/admin-actions';
import { signOutAction } from '@/actions/auth-actions';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { store } = await getStoreConfigAction();

  return (
    <div className="min-h-screen bg-[#0A0F1D] text-[#E2E8F0] flex flex-col justify-between">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-[#1E293B] px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/20"
            >
              <Store className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-plex-sans text-lg font-bold text-white flex items-center gap-2">
                {store.name}
                <span className="text-[10px] font-plex-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  STAFF DASHBOARD
                </span>
              </h1>
              <p className="text-[11px] text-[#64748B] font-plex-mono hidden sm:block">
                Tối ưu cảm ứng cho Mobile & Tablet
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <AudioAlertToggle />

            <Link
              href="/admin"
              className="px-2.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-plex-mono flex items-center gap-1.5 transition-colors"
              title="Trung Tâm Điều Hành SOC SIEM"
            >
              <ShieldAlert className="w-4 h-4" />
              <span className="hidden md:inline">SOC SIEM</span>
            </Link>

            <Link
              href="/"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            >
              <Home className="w-4 h-4" />
            </Link>

            <form action={signOutAction}>
              <button
                type="submit"
                title="Đăng xuất"
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full flex-1 p-4 md:p-6 pb-24">
        {children}
      </main>

      {/* Sticky Bottom/Tablet Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-[#1E293B] px-4 py-2">
        <div className="max-w-2xl mx-auto grid grid-cols-3 gap-2 text-center font-plex-mono text-xs">
          <Link
            href="/orders"
            className="flex flex-col items-center justify-center py-2 px-3 rounded-xl hover:bg-slate-900 text-slate-300 hover:text-amber-400 transition-all"
          >
            <ClipboardList className="w-5 h-5 text-amber-400 mb-1" />
            <span>Đơn Hàng / Bàn</span>
          </Link>

          <Link
            href="/menu-manage"
            className="flex flex-col items-center justify-center py-2 px-3 rounded-xl hover:bg-slate-900 text-slate-300 hover:text-cyan-400 transition-all"
          >
            <Utensils className="w-5 h-5 text-cyan-400 mb-1" />
            <span>Quản Lý Menu</span>
          </Link>

          <Link
            href="/tables"
            className="flex flex-col items-center justify-center py-2 px-3 rounded-xl hover:bg-slate-900 text-slate-300 hover:text-emerald-400 transition-all"
          >
            <QrCode className="w-5 h-5 text-emerald-400 mb-1" />
            <span>Mã QR 8 Bàn</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
