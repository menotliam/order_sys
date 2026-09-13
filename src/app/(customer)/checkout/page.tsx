'use client';

import { useState, useEffect, useTransition, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getOrderByIdAction } from '@/actions/order-actions';
import { getStoreConfigAction } from '@/actions/admin-actions';
import { Order, Store } from '@/types/database';
import { VietQRDisplay } from '@/components/customer/vietqr-display';
import {
  Clock,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId');

  const [order, setOrder] = useState<Order | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!orderId) {
      router.push('/menu');
      return;
    }
    startTransition(async () => {
      const [orderData, storeData] = await Promise.all([
        getOrderByIdAction(orderId),
        getStoreConfigAction(),
      ]);
      setOrder(orderData);
      setStore(storeData.store);
    });
  }, [orderId, router]);

  if (!order || !store) {
    return (
      <div className="min-h-screen bg-[#0A0F1D] flex items-center justify-center text-slate-400 font-plex-mono">
        Đang tải thông tin đơn hàng...
      </div>
    );
  }

  // If order is Pay-Later, display waiting for confirmation screen
  if (order.payment_method === 'pay_later') {
    return (
      <div className="min-h-screen bg-[#0A0F1D] text-white p-6 flex flex-col justify-between">
        <header className="flex items-center justify-between">
          <Link
            href="/menu"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-2 text-xs font-plex-mono"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay Lại Menu</span>
          </Link>
          <span className="font-plex-mono text-xs text-amber-400">
            ĐƠN TRẢ SAU (#{order.order_code})
          </span>
        </header>

        <div className="max-w-md mx-auto my-auto text-center space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto shadow-2xl shadow-amber-500/15">
            <Clock className="w-10 h-10 animate-pulse" />
          </div>

          <div>
            <h1 className="font-plex-sans text-3xl font-bold text-white">
              Yêu Cầu Trả Sau Đã Được Gửi
            </h1>
            <p className="text-sm text-slate-400 font-plex-sans mt-2">
              Đơn hàng #{order.order_code} trị giá{' '}
              <strong className="text-amber-400">
                {order.total_amount.toLocaleString('vi-VN')}đ
              </strong>{' '}
              đang chờ nhân viên quán xác nhận tại {order.table_number || 'Bàn Khách'}.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-left space-y-2">
            <div className="flex items-center justify-between text-xs font-plex-mono">
              <span className="text-slate-400">Quy tắc Bảo mật Lớp 1 & 2:</span>
              <span className="text-emerald-400">ĐÃ XÁC THỰC LỚP 1</span>
            </div>
            <p className="text-xs text-slate-400 font-plex-sans">
              Quán áp dụng quy định trần đơn nợ dưới 100,000đ và kiểm tra trực
              tiếp tại bàn để bảo vệ quyền lợi hai bên.
            </p>
          </div>

          <div className="pt-4">
            <Link
              href={`/order/${order.id}`}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-plex-sans text-xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 transition-all"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>THEO DÕI TRẠNG THÁI ĐƠN HÀNG</span>
            </Link>
          </div>
        </div>

        <footer className="text-center text-xs text-slate-500 font-plex-mono">
          {store.name} — SOC Security Verified
        </footer>
      </div>
    );
  }

  // Pay-Now -> Display NAPAS VietQR Code + Mock Pay Button
  return (
    <div className="min-h-screen bg-[#0A0F1D] text-white p-4 md:p-6 flex flex-col justify-between">
      <header className="max-w-md mx-auto w-full flex items-center justify-between mb-6">
        <Link
          href="/menu"
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-2 text-xs font-plex-mono"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay Lại Menu</span>
        </Link>
        <span className="font-plex-mono text-xs text-cyan-400">
          THANH TOÁN (#{order.order_code})
        </span>
      </header>

      <div className="max-w-md mx-auto w-full my-auto">
        <VietQRDisplay
          orderId={order.id}
          orderCode={order.order_code}
          amount={order.total_amount}
          bankId={store.vietqr_bank_id}
          accountNo={store.vietqr_account_no}
          accountName={store.vietqr_account_name}
        />
      </div>

      <footer className="max-w-md mx-auto w-full mt-6 text-center text-xs text-slate-500 font-plex-mono flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-cyan-400" />
        <span>Tự động xác nhận giao dịch qua NAPAS 247 Webhook</span>
      </footer>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0A0F1D] flex items-center justify-center text-slate-400 font-plex-mono">
          Đang tải trang thanh toán...
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
