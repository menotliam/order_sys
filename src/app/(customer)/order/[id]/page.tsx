'use client';

import { useState, useEffect, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getOrderByIdAction } from '@/actions/order-actions';
import { Order } from '@/types/database';
import {
  Clock,
  CheckCircle2,
  Utensils,
  Coffee,
  Sparkles,
  ArrowLeft,
  Home,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

export default function OrderTrackingPage() {
  const params = useParams();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [isPending, startTransition] = useTransition();

  // Poll for status changes every 3 seconds for demo realtime
  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = () => {
      startTransition(async () => {
        const res = await getOrderByIdAction(orderId);
        if (res) {
          setOrder(res);
        }
      });
    };

    fetchOrder();
    const timer = setInterval(fetchOrder, 3000);
    return () => clearInterval(timer);
  }, [orderId]);

  if (!order) {
    return (
      <div className="min-h-screen bg-[#0A0F1D] flex items-center justify-center text-slate-400 font-plex-mono">
        Đang tải tiến trình đơn hàng...
      </div>
    );
  }

  const steps = [
    {
      id: 'pending_approval',
      label: 'Chờ xác nhận',
      desc: order.payment_method === 'pay_now' ? 'Đang kiểm tra thanh toán' : 'Chờ nhân viên duyệt Pay-Later',
    },
    {
      id: 'paid_preparing',
      label: 'Đang pha chế',
      desc: 'Quầy bar đang làm món',
    },
    {
      id: 'ready',
      label: 'Ready',
      desc: 'Món đã hoàn tất pha chế',
    },
    {
      id: 'completed',
      label: 'Hoàn thành',
      desc: 'Đã phục vụ tận bàn',
    },
  ];

  const currentStepIdx = steps.findIndex((s) => s.id === order.status);

  return (
    <div className="min-h-screen bg-[#0A0F1D] text-white p-4 md:p-6 pb-12">
      {/* Header */}
      <header className="max-w-md mx-auto flex items-center justify-between mb-6">
        <Link
          href="/menu"
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-2 text-xs font-plex-mono"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Tiếp tục gọi món</span>
        </Link>
        <Link
          href="/"
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
        >
          <Home className="w-4 h-4" />
        </Link>
      </header>

      {/* Main Card */}
      <main className="max-w-md mx-auto space-y-6">
        {/* Order Code & Table */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 text-[#00E5FF] font-plex-mono text-xs border border-cyan-500/30 mb-2">
            <Utensils className="w-3.5 h-3.5" />
            <span>{order.table_number || 'Bàn Khách'}</span>
          </div>

          <h1 className="font-plex-sans text-3xl font-bold text-white">
            Đơn Hàng #{order.order_code}
          </h1>

          <div className="mt-2 text-xs font-plex-mono text-slate-400">
            Hình thức:{' '}
            <strong className="text-cyan-400">
              {order.payment_method === 'pay_now' ? 'VietQR (Pay Now)' : 'Trả Sau (Pay Later)'}
            </strong>{' '}
            • {order.is_paid ? 'Đã thanh toán' : 'Chưa thanh toán'}
          </div>

          {/* STATUS GLOW BANNERS */}
          {order.status === 'ready' && (
            <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/50 text-left animate-pulse">
              <div className="flex items-center gap-2 text-emerald-400 font-plex-sans text-xl font-bold">
                <Sparkles className="w-6 h-6" />
                <span>READY — MÓN ĐÃ SẴN SÀNG!</span>
              </div>
              <p className="text-xs text-emerald-200 font-plex-sans mt-1">
                Nhân viên phục vụ sẽ mang đồ uống đến tận bàn cho bạn trong giây
                lát. Vui lòng giữ vị trí tại bàn.
              </p>
            </div>
          )}

          {order.status === 'completed' && (
            <div className="mt-6 p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-left">
              <div className="flex items-center gap-2 text-cyan-400 font-plex-sans text-xl font-bold">
                <CheckCircle2 className="w-6 h-6" />
                <span>ĐÃ HOÀN THÀNH PHỤC VỤ</span>
              </div>
              <p className="text-xs text-slate-300 font-plex-sans mt-1">
                Chúc bạn thưởng thức đồ uống ngon miệng tại The Cyber Coffee!
              </p>
            </div>
          )}

          {order.status === 'cancelled' && (
            <div className="mt-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-left">
              <div className="flex items-center gap-2 text-red-400 font-plex-sans text-xl font-bold">
                <AlertCircle className="w-6 h-6" />
                <span>ĐƠN HÀNG ĐÃ BỊ HỦY</span>
              </div>
              <p className="text-xs text-slate-300 font-plex-sans mt-1">
                Vui lòng liên hệ nhân viên quán để được hỗ trợ chi tiết.
              </p>
            </div>
          )}
        </div>

        {/* Stepper Workflow (4 steps) */}
        {order.status !== 'cancelled' && (
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800">
            <h3 className="font-plex-sans text-lg font-bold text-white mb-6">
              Tiến Trình Đơn Hàng
            </h3>

            <div className="space-y-6 relative before:absolute before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
              {steps.map((step, idx) => {
                const isCompleted = currentStepIdx > idx;
                const isCurrent = currentStepIdx === idx;

                return (
                  <div
                    key={step.id}
                    className="relative flex items-start gap-4 z-10"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${
                        isCompleted
                          ? 'bg-cyan-500 border-cyan-500 text-slate-950 font-bold'
                          : isCurrent
                            ? 'bg-slate-950 border-cyan-400 text-cyan-400 shadow-lg shadow-cyan-500/30 animate-pulse'
                            : 'bg-slate-950 border-slate-700 text-slate-600'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <span className="font-plex-mono text-xs">
                          {idx + 1}
                        </span>
                      )}
                    </div>

                    <div>
                      <div
                        className={`font-plex-sans text-base font-bold ${
                          isCurrent
                            ? 'text-cyan-400'
                            : isCompleted
                              ? 'text-white'
                              : 'text-slate-500'
                        }`}
                      >
                        {step.label}
                      </div>
                      <div className="text-xs text-slate-400 font-plex-sans mt-0.5">
                        {step.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Order Items Summary */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="font-plex-sans text-lg font-bold text-white">
            Chi Tiết Món ({order.items?.length || 0})
          </h3>

          <div className="space-y-3">
            {order.items?.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-3 text-sm border-b border-slate-800/80 pb-3 last:border-0 last:pb-0"
              >
                <div>
                  <div className="font-plex-sans font-bold text-white">
                    {item.quantity}x {item.product_name}
                  </div>
                  {item.note && (
                    <div className="text-xs text-cyan-400 font-plex-mono mt-0.5 bg-cyan-500/10 px-2 py-0.5 rounded inline-block">
                      {item.note}
                    </div>
                  )}
                </div>
                <div className="font-plex-mono font-bold text-cyan-400">
                  {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between font-plex-mono text-sm">
            <span className="text-slate-400">Tổng thanh toán:</span>
            <span className="text-xl font-bold text-cyan-400">
              {order.total_amount.toLocaleString('vi-VN')} VNĐ
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
