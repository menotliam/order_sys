'use client';

import { useState } from 'react';
import { CartItem } from '@/types/order';
import {
  ShoppingBag,
  X,
  Trash2,
  ArrowRight,
  User,
  Phone,
  ShieldCheck,
  CreditCard,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createOrderAction } from '@/actions/order-actions';

interface CartSheetProps {
  storeId: string;
  tableId: string;
  tableNumber: string;
  items: CartItem[];
  onUpdateQuantity: (idx: number, newQty: number) => void;
  onRemoveItem: (idx: number) => void;
  onClearCart: () => void;
}

export function CartSheet({
  storeId,
  tableId,
  tableNumber,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}: CartSheetProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'pay_now' | 'pay_later'>('pay_now');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [securityError, setSecurityError] = useState<string | null>(null);

  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  if (totalCount === 0 && !isOpen) return null;

  const handleSubmitOrder = async () => {
    if (!items || items.length === 0 || totalAmount <= 0) {
      setSecurityError(
        'Giỏ hàng trống hoặc số tiền không hợp lệ (0đ). Vui lòng chọn món trước khi thanh toán.'
      );
      return;
    }

    setIsSubmitting(true);
    setSecurityError(null);

    try {
      const res = await createOrderAction({
        store_id: storeId,
        table_id: tableId,
        payment_method: paymentMethod,
        customer_name: customerName.trim() || `Khách (${tableNumber})`,
        customer_phone: customerPhone.trim(),
        items,
      });

      if (!res.success) {
        // Layer 1 Security Block triggered!
        setSecurityError(
          res.security_block?.message ||
            'Hệ thống từ chối do quá giới hạn đơn chờ chưa thanh toán.'
        );
        setIsSubmitting(false);
        return;
      }

      // Order created successfully!
      onClearCart();
      setIsOpen(false);

      if (paymentMethod === 'pay_now' && res.order_id) {
        router.push(`/checkout?orderId=${res.order_id}`);
      } else if (res.order_id) {
        router.push(`/order/${res.order_id}`);
      }
    } catch {
      setSecurityError('Lỗi kết nối khi gửi đơn hàng. Vui lòng thử lại.');
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Cart Button */}
      {!isOpen && totalCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 max-w-md mx-auto">
          <button
            onClick={() => setIsOpen(true)}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 px-5 py-4 rounded-2xl shadow-xl shadow-cyan-500/25 flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-950/20 flex items-center justify-center font-plex-mono font-bold text-sm">
                {totalCount}
              </div>
              <span className="font-plex-sans text-lg font-bold">
                Giỏ Hàng — {tableNumber}
              </span>
            </div>

            <div className="flex items-center gap-2 font-plex-mono font-bold text-base">
              <span>{totalAmount.toLocaleString('vi-VN')}đ</span>
              <ArrowRight className="w-5 h-5" />
            </div>
          </button>
        </div>
      )}

      {/* Cart Bottom Sheet Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in-0">
          <div className="w-full max-w-md bg-slate-900 border-t sm:border border-slate-800 rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            {/* Sheet Header */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-cyan-400" />
                <h3 className="font-plex-sans text-xl font-bold text-white">
                  Xác Nhận Đơn Đồ Uống ({tableNumber})
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="p-4 flex-1 overflow-y-auto space-y-4">
              {securityError && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="text-xs font-plex-sans">
                    <span className="font-bold block mb-1 font-plex-mono uppercase">
                      Bảo vệ Lớp 1 (Pay-Later Rate Limit)
                    </span>
                    {securityError}
                  </div>
                </div>
              )}

              {items.length === 0 ? (
                <div className="p-8 text-center bg-slate-950 rounded-2xl border border-slate-800 space-y-3 my-6">
                  <ShoppingBag className="w-10 h-10 text-slate-600 mx-auto" />
                  <div className="font-plex-sans text-lg font-bold text-slate-300">
                    Giỏ hàng hiện đang trống (0đ)
                  </div>
                  <p className="text-xs text-slate-500 font-plex-sans">
                    Bạn đã xoá hết các món trong đơn hàng. Vui lòng quay lại thực đơn để chọn món.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 font-plex-mono text-xs font-bold transition-colors"
                  >
                    Quay lại Menu đồ uống
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-plex-sans text-base font-bold text-white">
                          {item.product_name}
                        </div>
                        {item.note && (
                          <div className="text-xs text-cyan-400 mt-1 font-plex-mono bg-cyan-500/10 px-2 py-0.5 rounded inline-block">
                            Ghi chú: {item.note}
                          </div>
                        )}
                        <div className="text-xs text-slate-400 font-plex-mono mt-1">
                          {item.price.toLocaleString('vi-VN')}đ / món
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                          <button
                            onClick={() => onUpdateQuantity(idx, item.quantity - 1)}
                            className="w-7 h-7 rounded bg-slate-800 text-slate-300 hover:text-white font-plex-mono text-xs font-bold"
                          >
                            -
                          </button>
                          <span className="w-6 text-center font-plex-mono text-xs font-bold text-white">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(idx, item.quantity + 1)}
                            className="w-7 h-7 rounded bg-slate-800 text-slate-300 hover:text-white font-plex-mono text-xs font-bold"
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() => onRemoveItem(idx)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Payment Method Option */}
              <div className="pt-3 border-t border-slate-800 space-y-3">
                <span className="text-xs font-plex-mono uppercase tracking-wider text-slate-400 block">
                  Chọn hình thức thanh toán
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('pay_now')}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      paymentMethod === 'pay_now'
                        ? 'bg-cyan-500/10 border-cyan-500 text-white shadow-lg shadow-cyan-500/10'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <CreditCard className="w-4 h-4 text-cyan-400" />
                      {paymentMethod === 'pay_now' && (
                        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                      )}
                    </div>
                    <div className="mt-2">
                      <div className="font-plex-sans text-sm font-bold">
                        Thanh toán ngay
                      </div>
                      <div className="text-[10px] font-plex-mono text-slate-400 mt-0.5">
                        Mã VietQR tự động
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('pay_later')}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      paymentMethod === 'pay_later'
                        ? 'bg-amber-500/10 border-amber-500 text-white shadow-lg shadow-amber-500/10'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <Clock className="w-4 h-4 text-amber-400" />
                      {paymentMethod === 'pay_later' && (
                        <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      )}
                    </div>
                    <div className="mt-2">
                      <div className="font-plex-sans text-sm font-bold">
                        Thanh toán sau
                      </div>
                      <div className="text-[10px] font-plex-mono text-amber-400 mt-0.5">
                        Nhân viên xác nhận
                      </div>
                    </div>
                  </button>
                </div>

                {paymentMethod === 'pay_later' && (
                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-plex-sans flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>
                      Áp dụng Giới hạn 2 đơn/10 phút & Trần đơn nợ &lt; 100k
                      VND để bảo vệ Quán.
                    </span>
                  </div>
                )}
              </div>

              {/* Optional Customer info */}
              <div className="pt-3 border-t border-slate-800 space-y-3">
                <span className="text-xs font-plex-mono uppercase tracking-wider text-slate-400 block">
                  Thông tin người đặt (Tùy chọn)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute top-3 left-3" />
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Tên của bạn"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-600 outline-none font-plex-sans"
                    />
                  </div>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute top-3 left-3" />
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Số điện thoại"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-600 outline-none font-plex-sans"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Summary & Submit Button */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between font-plex-mono text-sm">
                <span className="text-slate-400">Tổng cộng ({totalCount} món):</span>
                <span className="text-xl font-bold text-cyan-400">
                  {totalAmount.toLocaleString('vi-VN')} VNĐ
                </span>
              </div>

              <button
                type="button"
                onClick={handleSubmitOrder}
                disabled={isSubmitting || items.length === 0 || totalAmount <= 0}
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-plex-sans text-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all"
              >
                <span>
                  {isSubmitting
                    ? 'ĐANG XỬ LÝ ĐƠN HÀNG...'
                    : paymentMethod === 'pay_now'
                      ? 'TIẾN HÀNH THANH TOÁN VIETQR'
                      : 'GỬI YÊU CẦU TRẢ SAU CHO QUÁN'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
