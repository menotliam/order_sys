'use client';

import { useState } from 'react';
import { generateVietQRUrl } from '@/lib/vietqr';
import { mockPaySuccessAction } from '@/actions/order-actions';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import {
  QrCode,
  CheckCircle2,
  Copy,
  Check,
  Zap,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface VietQRDisplayProps {
  orderId: string;
  orderCode: string;
  amount: number;
  bankId: string;
  accountNo: string;
  accountName: string;
}

export function VietQRDisplay({
  orderId,
  orderCode,
  amount,
  bankId,
  accountNo,
  accountName,
}: VietQRDisplayProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  const qrUrl = generateVietQRUrl({
    bankId,
    accountNo,
    accountName,
    amount,
    orderCode,
  });

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(accountNo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMockPay = async () => {
    setIsSimulating(true);
    const ok = await mockPaySuccessAction(orderId);
    if (ok) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      setTimeout(() => {
        router.push(`/order/${orderId}`);
      }, 1200);
    } else {
      setIsSimulating(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-6 text-center text-white">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-plex-mono uppercase tracking-wider mb-2">
          <QrCode className="w-3.5 h-3.5" />
          <span>NAPAS 247 Dynamic QR</span>
        </div>
        <h2 className="font-plex-sans text-2xl font-bold">
          Quét Mã Thanh Toán VietQR
        </h2>
        <p className="text-xs text-cyan-100 font-plex-mono mt-1">
          Mã đơn: #{orderCode} • Nội dung tự động
        </p>
      </div>

      {/* QR Code Card */}
      <div className="p-6 flex flex-col items-center">
        <div className="p-4 bg-white rounded-2xl shadow-xl border-4 border-cyan-500/30">
          <img
            src={qrUrl}
            alt="VietQR NAPAS"
            className="w-56 h-56 object-contain"
          />
        </div>

        {/* Bank & Amount Details */}
        <div className="mt-6 w-full space-y-3 font-plex-mono text-sm">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400 text-xs">Số tiền cần chuyển:</span>
            <span className="text-lg font-bold text-cyan-400">
              {amount.toLocaleString('vi-VN')} VNĐ
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-slate-400 text-xs block">Ngân hàng MBBank:</span>
              <span className="font-bold text-white text-base">{accountNo}</span>
            </div>
            <button
              onClick={handleCopyAccount}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-slate-700 text-xs flex items-center gap-1 transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Đã sao chép</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Sao chép STK</span>
                </>
              )}
            </button>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center text-xs text-slate-400">
            Chủ tài khoản: <strong className="text-white">{accountName}</strong>
          </div>
        </div>

        {/* Mock Pay Sandbox Button */}
        <div className="mt-6 w-full pt-6 border-t border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-plex-mono uppercase tracking-wider text-amber-400 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" />
              <span>Chức năng Kiểm thử (Sandbox)</span>
            </span>
            <span className="text-[11px] font-plex-mono text-slate-500">
              SOC Telemetry Enabled
            </span>
          </div>

          <button
            onClick={handleMockPay}
            disabled={isSimulating}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-plex-sans text-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>
              {isSimulating
                ? 'ĐANG XỬ LÝ THANH TOÁN VIETQR...'
                : 'GIẢ LẬP THANH TOÁN THÀNH CÔNG (MOCK PAY)'}
            </span>
          </button>
          <p className="text-[11px] text-slate-400 text-center mt-2 font-plex-sans">
            Nhấn để mô phỏng Webhook ngân hàng trả về thanh toán thành công và
            nhảy sang trạng thái chuẩn bị.
          </p>
        </div>
      </div>
    </div>
  );
}
