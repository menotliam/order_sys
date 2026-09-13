'use client';

import { useState, useEffect, useTransition, useMemo } from 'react';
import {
  getStoreConfigAction,
  updateStoreVietQRAction,
  updateSecurityThresholdsAction,
} from '@/actions/admin-actions';
import { SecurityThresholds } from '@/types/database';
import { toast } from 'sonner';
import {
  CreditCard,
  ShieldCheck,
  RefreshCw,
  Save,
  Volume2,
  VolumeX,
  AlertTriangle,
  Settings,
  Bell,
  Check,
  Copy,
  Sliders,
  ExternalLink,
  ShieldAlert,
  Zap,
  Info,
  Radio,
  Clock,
  Plus,
  Minus,
  RotateCcw,
  Sparkles,
  Shield,
  HelpCircle,
} from 'lucide-react';

const VIETNAM_BANKS = [
  { id: '970422', name: 'MBBank - Ngân hàng Quân Đội', shortName: 'MB' },
  { id: '970436', name: 'Vietcombank - Ngân hàng Ngoại Thương', shortName: 'VCB' },
  { id: '970415', name: 'VietinBank - Ngân hàng Công Thương', shortName: 'CTG' },
  { id: '970418', name: 'BIDV - Ngân hàng Đầu tư và Phát triển', shortName: 'BIDV' },
  { id: '970407', name: 'Techcombank - Ngân hàng Kỹ Thương', shortName: 'TCB' },
  { id: '970405', name: 'Agribank - Ngân hàng Nông nghiệp', shortName: 'VBA' },
  { id: '970416', name: 'ACB - Ngân hàng Á Châu', shortName: 'ACB' },
  { id: '970432', name: 'VPBank - Ngân hàng Việt Nam Thịnh Vượng', shortName: 'VPB' },
  { id: '970423', name: 'TPBank - Ngân hàng Tiên Phong', shortName: 'TPB' },
];

const PRESETS = [
  {
    name: 'CHẶT CHẼ (STRICT)',
    desc: 'Quán đông, chống phá hoại tối đa',
    badge: 'STRICT DEFENSE',
    color: 'text-[#FF1744] border-[#FF1744]/30 bg-[#FF1744]/10 hover:bg-[#FF1744]/20',
    config: { max_pay_later_per_window: 1, rate_limit_window_min: 15, unpaid_ceiling_vnd: 50000 },
  },
  {
    name: 'TIÊU CHUẨN (BALANCED)',
    desc: 'Khuyên dùng cho giờ hoạt động bình thường',
    badge: 'RECOMMENDED',
    color: 'text-[#FFB800] border-[#FFB800]/30 bg-[#FFB800]/10 hover:bg-[#FFB800]/20',
    config: { max_pay_later_per_window: 2, rate_limit_window_min: 10, unpaid_ceiling_vnd: 100000 },
  },
  {
    name: 'NỚI LỎNG (RELAXED)',
    desc: 'Nhóm khách quen hoặc sự kiện lớn',
    badge: 'HIGH CAPACITY',
    color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20',
    config: { max_pay_later_per_window: 5, rate_limit_window_min: 5, unpaid_ceiling_vnd: 300000 },
  },
];

export default function AdminConfigPage() {
  // VietQR state
  const [bankId, setBankId] = useState('970422');
  const [accountNo, setAccountNo] = useState('0987654321');
  const [accountName, setAccountName] = useState('THE CYBER COFFEE SOC');

  // Security thresholds state
  const [thresholds, setThresholds] = useState<SecurityThresholds>({
    max_pay_later_per_window: 2,
    rate_limit_window_min: 10,
    unpaid_ceiling_vnd: 100000,
    audio_alert_enabled: true,
  });

  const [copiedPayload, setCopiedPayload] = useState(false);
  const [isPlayingSound, setIsPlayingSound] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const res = await getStoreConfigAction();
      setBankId(res.store.vietqr_bank_id || '970422');
      setAccountNo(res.store.vietqr_account_no || '0987654321');
      setAccountName(res.store.vietqr_account_name || 'THE CYBER COFFEE SOC');
      if (res.store.security_thresholds) {
        setThresholds(res.store.security_thresholds);
      }
    });
  }, []);

  const selectedBank = VIETNAM_BANKS.find((b) => b.id === bankId) || VIETNAM_BANKS[0];
  const previewQrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=55000&addInfo=TEST+QR+PREVIEW&accountName=${encodeURIComponent(
    accountName
  )}`;

  const handleTestSiren = () => {
    setIsPlayingSound(true);
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(440, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch {}
    setTimeout(() => setIsPlayingSound(false), 550);
  };

  const handleCopyPayload = () => {
    const payload = JSON.stringify(
      {
        bankId,
        bankName: selectedBank.name,
        accountNo,
        accountName,
        qrFormat: 'Napas 247 Compact2',
      },
      null,
      2
    );
    navigator.clipboard.writeText(payload);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    setThresholds((prev) => ({
      ...prev,
      ...preset.config,
    }));
    toast.info(`ĐÃ ÁP DỤNG CẤU HÌNH: ${preset.name}`, {
      description: preset.desc,
      duration: 3000,
    });
  };

  const handleSaveVietQR = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      await updateStoreVietQRAction(bankId, accountNo, accountName);
      toast.success('CẤU HÌNH VIETQR ĐÃ ĐƯỢC CẬP NHẬT', {
        description: 'Sự kiện VIETQR_CONFIG_UPDATED đã được ghi nhận vào SIEM audit log.',
        duration: 3500,
        icon: <CreditCard className="w-4 h-4 text-emerald-400" />,
      });
    });
  };

  const handleSaveThresholds = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      await updateSecurityThresholdsAction(thresholds);
      toast.success('CHÍNH SÁCH BẢO MẬT ĐÃ ĐƯỢC KÍCH HOẠT', {
        description: 'Quy tắc Rate Limit & Trần nợ mới đã kích hoạt trên Layer 1 Defense.',
        duration: 3500,
        icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
      });
    });
  };

  // Real-time calculation metrics
  const impactAnalysis = useMemo(() => {
    const orders = Math.max(1, thresholds.max_pay_later_per_window);
    const windowMin = Math.max(1, thresholds.rate_limit_window_min);
    const ceilingVnd = thresholds.unpaid_ceiling_vnd;

    const avgSecondsPerOrder = Math.round((windowMin * 60) / orders);

    let posture: 'STRICT' | 'BALANCED' | 'RELAXED' = 'BALANCED';
    let postureText = 'CÂN BẰNG (KHUYÊN DÙNG)';
    let postureColor = 'text-[#FFB800] bg-[#FFB800]/10 border-[#FFB800]/30';

    if (orders <= 1 || ceilingVnd <= 60000 || windowMin >= 20) {
      posture = 'STRICT';
      postureText = 'PHÒNG THỦ CHẶT CHẼ';
      postureColor = 'text-[#FF1744] bg-[#FF1744]/10 border-[#FF1744]/30';
    } else if (orders >= 4 || ceilingVnd >= 250000) {
      posture = 'RELAXED';
      postureText = 'NỚI LỎNG DUNG LƯỢNG CAO';
      postureColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    }

    return {
      avgSecondsPerOrder,
      posture,
      postureText,
      postureColor,
    };
  }, [thresholds]);

  return (
    <div className="space-y-8">
      {/* ─── SECTION 1: VIETQR NAPAS MASTER CONFIG ──────────────────────── */}
      <div className="siem-panel overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] bg-[#12141C] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#E5BDDF]/10 text-[#E5BDDF] border border-[#E5BDDF]/20">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-plex-sans text-sm md:text-base font-bold text-white flex items-center gap-2">
                VIETQR NAPAS 24/7 MASTER CONFIGURATION
                <span className="text-[10px] font-plex-mono text-[#E5BDDF] bg-[#E5BDDF]/10 px-2 py-0.5 border border-[#E5BDDF]/20">
                  SEPAY INTEGRATED
                </span>
              </h3>
              <p className="text-[11px] text-[#8E9EB5] font-plex-mono">
                Cổng thanh toán tự động chuyển khoản qua mã QR động tiêu chuẩn Napas 247
              </p>
            </div>
          </div>
          <span className="text-[10px] font-plex-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 border border-emerald-500/25 hidden sm:inline-block">
            GATEWAY: ONLINE
          </span>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Config Form (7 cols) */}
            <form onSubmit={handleSaveVietQR} className="lg:col-span-7 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-plex-mono uppercase tracking-widest text-[#8E9EB5] block">
                  1. Ngân Hàng Hưởng Thụ (Napas BIN)
                </label>
                <select
                  value={bankId}
                  onChange={(e) => setBankId(e.target.value)}
                  className="w-full bg-[#0B0C10] border border-white/[0.08] focus:border-[#E5BDDF]/50 p-3 text-[12px] text-white outline-none font-plex-sans transition-colors cursor-pointer"
                >
                  {VIETNAM_BANKS.map((b) => (
                    <option key={b.id} value={b.id} className="bg-[#12141C] text-white">
                      [{b.id}] — {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-plex-mono uppercase tracking-widest text-[#8E9EB5] block">
                  2. Số Tài Khoản Ngân Hàng (STK)
                </label>
                <input
                  type="text"
                  value={accountNo}
                  onChange={(e) => setAccountNo(e.target.value.replace(/\s+/g, ''))}
                  placeholder="Nhập số tài khoản..."
                  className="w-full bg-[#0B0C10] border border-white/[0.08] focus:border-[#E5BDDF]/50 p-3 text-[12px] font-plex-mono text-white outline-none transition-colors"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-plex-mono uppercase tracking-widest text-[#8E9EB5] block">
                  3. Tên Chủ Tài Khoản (In Hoa Không Dấu)
                </label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value.toUpperCase())}
                  placeholder="VD: THE CYBER COFFEE SOC"
                  className="w-full bg-[#0B0C10] border border-white/[0.08] focus:border-[#E5BDDF]/50 p-3 text-[12px] font-plex-mono text-white outline-none transition-colors"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-3.5 px-5 bg-[#E5BDDF] hover:bg-[#D4AACE] text-[#0B0C10] font-plex-sans text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_24px_rgba(229,189,223,0.2)] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>ĐANG LƯU CẤU HÌNH...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>CẬP NHẬT CẤU HÌNH VIETQR MASTER</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Live Holographic QR Preview (5 cols) */}
            <div className="lg:col-span-5 flex flex-col items-center justify-between border-t lg:border-t-0 lg:border-l border-white/[0.08] pt-6 lg:pt-0 lg:pl-8">
              <div className="w-full text-center">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-plex-mono uppercase tracking-widest text-[#E5BDDF] flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" />
                    XEM TRƯỚC MÃ QR ĐỘNG
                  </span>
                  <span className="px-2 py-0.5 bg-[#E5BDDF]/10 text-[#E5BDDF] font-plex-mono text-[10px] border border-[#E5BDDF]/25">
                    MẪU: 55.000Đ
                  </span>
                </div>

                {/* QR Box with Laser Scanline */}
                <div className="relative inline-block p-4 bg-white border border-white/20 shadow-[0_0_32px_rgba(229,189,223,0.15)] overflow-hidden">
                  <div className="siem-laser-scanline" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewQrUrl}
                    alt="VietQR Dynamic Preview"
                    className="w-44 h-44 object-contain"
                  />
                </div>

                {/* Account Details Readout */}
                <div className="mt-4 p-3 bg-black/40 border border-white/[0.06] font-plex-mono text-[11px] space-y-1 text-left">
                  <div className="flex justify-between">
                    <span className="text-[#8E9EB5]">Ngân hàng:</span>
                    <span className="text-white font-bold">{selectedBank.shortName} ({bankId})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8E9EB5]">Số tài khoản:</span>
                    <span className="text-[#E5BDDF] font-bold">{accountNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8E9EB5]">Chủ tài khoản:</span>
                    <span className="text-white">{accountName}</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-center gap-2">
                  <button
                    onClick={handleCopyPayload}
                    className="px-3 py-1.5 bg-[#161822] hover:bg-[#1C202E] border border-white/[0.08] text-[10px] font-plex-mono text-[#CBD5E1] flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedPayload ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedPayload ? 'ĐÃ COPY PAYLOAD' : 'COPY CẤU HÌNH'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── SECTION 2: SECURITY POLICY & THRESHOLDS (RE-DESIGNED) ───────── */}
      <div className="siem-panel overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] bg-[#12141C] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#FFB800]/10 text-[#FFB800] border border-[#FFB800]/20">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-plex-sans text-sm md:text-base font-bold text-white flex items-center gap-2">
                CẤU HÌNH NGƯỠNG BẢO MẬT & QUY TẮC PHÒNG THỦ
                <span className="text-[10px] font-plex-mono text-[#FFB800] bg-[#FFB800]/10 px-2 py-0.5 border border-[#FFB800]/20">
                  PRECISION CONTROLS
                </span>
              </h3>
              <p className="text-[11px] text-[#8E9EB5] font-plex-mono">
                Điều chỉnh thủ công từng thông số bảo vệ Layer 1 (Tần suất tạo đơn, trần nợ & còi hú SOC)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className={`text-[10px] font-plex-mono px-2.5 py-1 font-bold border ${impactAnalysis.postureColor}`}>
              {impactAnalysis.postureText}
            </span>
          </div>
        </div>

        {/* Quick Presets Bar */}
        <div className="p-4 border-b border-white/[0.06] bg-[#0E1017] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[11px] font-plex-mono text-[#8E9EB5]">
            <Sparkles className="w-3.5 h-3.5 text-[#FFB800]" />
            <span>MẪU THIẾT LẬP NHANH (PRESETS):</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className={`px-3 py-1 text-[11px] font-plex-mono font-bold border transition-all cursor-pointer ${preset.color}`}
                title={preset.desc}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSaveThresholds} className="p-6 space-y-6">
          {/* 3 Precision Input Cards + 1 Audio Siren Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* CARD 1: TỐI ĐA ĐƠN TRẢ SAU */}
            <div className="p-4 bg-[#0B0C10] border border-white/[0.08] flex flex-col justify-between space-y-4 group hover:border-[#FFB800]/40 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-plex-mono uppercase tracking-widest text-[#8E9EB5] flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#FFB800]" />
                    TỐI ĐA ĐƠN TRẢ SAU
                  </span>
                  <span className="text-[9px] font-plex-mono text-[#FFB800] bg-[#FFB800]/10 px-1.5 py-0.2 border border-[#FFB800]/20">
                    ANTI-SPAM
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B] font-plex-sans">
                  Số lượng đơn Pay-Later tối đa được phép tạo trong 1 cửa sổ thời gian.
                </p>
              </div>

              {/* Stepper + Direct Numeric Input */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 bg-[#12141C] p-1.5 border border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() =>
                      setThresholds((t) => ({
                        ...t,
                        max_pay_later_per_window: Math.max(1, t.max_pay_later_per_window - 1),
                      }))
                    }
                    disabled={thresholds.max_pay_later_per_window <= 1}
                    className="w-9 h-9 flex items-center justify-center bg-[#1C202E] hover:bg-[#252B3E] text-white border border-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <div className="flex-1 flex items-center justify-center gap-1">
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={thresholds.max_pay_later_per_window || ''}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setThresholds((t) => ({
                          ...t,
                          max_pay_later_per_window: isNaN(val) ? 0 : val,
                        }));
                      }}
                      className="w-16 text-center font-plex-mono text-xl font-bold text-[#FFB800] bg-transparent outline-none tabular-nums"
                    />
                    <span className="text-[11px] font-plex-mono text-[#8E9EB5]">đơn</span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setThresholds((t) => ({
                        ...t,
                        max_pay_later_per_window: Math.min(50, t.max_pay_later_per_window + 1),
                      }))
                    }
                    className="w-9 h-9 flex items-center justify-center bg-[#1C202E] hover:bg-[#252B3E] text-white border border-white/[0.06] transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick Value Chips */}
                <div className="flex items-center justify-between gap-1 text-[10px] font-plex-mono">
                  {[1, 2, 3, 5, 10].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setThresholds((t) => ({ ...t, max_pay_later_per_window: v }))}
                      className={`flex-1 py-1 text-center border transition-colors cursor-pointer ${
                        thresholds.max_pay_later_per_window === v
                          ? 'bg-[#FFB800] text-[#0B0C10] font-bold border-[#FFB800]'
                          : 'bg-black/30 text-[#8E9EB5] border-white/[0.06] hover:text-white'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Validation Message */}
              {thresholds.max_pay_later_per_window < 1 ? (
                <div className="text-[10px] font-plex-mono text-[#FF1744] flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Tối thiểu 1 đơn
                </div>
              ) : thresholds.max_pay_later_per_window > 10 ? (
                <div className="text-[10px] font-plex-mono text-[#FFB800] flex items-center gap-1">
                  <Info className="w-3 h-3" /> Ngưỡng cao có thể tăng nguy cơ spam
                </div>
              ) : (
                <div className="text-[10px] font-plex-mono text-emerald-400 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Ngưỡng hợp lệ
                </div>
              )}
            </div>

            {/* CARD 2: CỬA SỔ THỜI GIAN RATE LIMIT */}
            <div className="p-4 bg-[#0B0C10] border border-white/[0.08] flex flex-col justify-between space-y-4 group hover:border-[#FFB800]/40 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-plex-mono uppercase tracking-widest text-[#8E9EB5] flex items-center gap-1.5 font-bold">
                    <Clock className="w-3.5 h-3.5 text-[#FFB800]" />
                    CỬA SỔ RATE LIMIT
                  </span>
                  <span className="text-[9px] font-plex-mono text-[#FFB800] bg-[#FFB800]/10 px-1.5 py-0.2 border border-[#FFB800]/20">
                    WINDOW TIME
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B] font-plex-sans">
                  Khoảng thời gian đếm và kiểm tra tần suất gửi đơn Pay-Later.
                </p>
              </div>

              {/* Stepper + Direct Numeric Input */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 bg-[#12141C] p-1.5 border border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() =>
                      setThresholds((t) => ({
                        ...t,
                        rate_limit_window_min: Math.max(1, t.rate_limit_window_min - 1),
                      }))
                    }
                    disabled={thresholds.rate_limit_window_min <= 1}
                    className="w-9 h-9 flex items-center justify-center bg-[#1C202E] hover:bg-[#252B3E] text-white border border-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <div className="flex-1 flex items-center justify-center gap-1">
                    <input
                      type="number"
                      min={1}
                      max={1440}
                      value={thresholds.rate_limit_window_min || ''}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setThresholds((t) => ({
                          ...t,
                          rate_limit_window_min: isNaN(val) ? 0 : val,
                        }));
                      }}
                      className="w-16 text-center font-plex-mono text-xl font-bold text-[#FFB800] bg-transparent outline-none tabular-nums"
                    />
                    <span className="text-[11px] font-plex-mono text-[#8E9EB5]">phút</span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setThresholds((t) => ({
                        ...t,
                        rate_limit_window_min: Math.min(1440, t.rate_limit_window_min + 1),
                      }))
                    }
                    className="w-9 h-9 flex items-center justify-center bg-[#1C202E] hover:bg-[#252B3E] text-white border border-white/[0.06] transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick Value Chips */}
                <div className="flex items-center justify-between gap-1 text-[10px] font-plex-mono">
                  {[5, 10, 15, 30, 60].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setThresholds((t) => ({ ...t, rate_limit_window_min: v }))}
                      className={`flex-1 py-1 text-center border transition-colors cursor-pointer ${
                        thresholds.rate_limit_window_min === v
                          ? 'bg-[#FFB800] text-[#0B0C10] font-bold border-[#FFB800]'
                          : 'bg-black/30 text-[#8E9EB5] border-white/[0.06] hover:text-white'
                      }`}
                    >
                      {v}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Validation Message */}
              {thresholds.rate_limit_window_min < 1 ? (
                <div className="text-[10px] font-plex-mono text-[#FF1744] flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Tối thiểu 1 phút
                </div>
              ) : thresholds.rate_limit_window_min > 120 ? (
                <div className="text-[10px] font-plex-mono text-[#FFB800] flex items-center gap-1">
                  <Info className="w-3 h-3" /> Cửa sổ quá dài có thể khoá nhầm khách cũ
                </div>
              ) : (
                <div className="text-[10px] font-plex-mono text-emerald-400 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Cửa sổ tối ưu
                </div>
              )}
            </div>

            {/* CARD 3: NGƯỠNG TRẦN NỢ PAY-LATER */}
            <div className="p-4 bg-[#0B0C10] border border-white/[0.08] flex flex-col justify-between space-y-4 group hover:border-[#FF1744]/40 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-plex-mono uppercase tracking-widest text-[#8E9EB5] flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#FF1744]" />
                    TRẦN NỢ PAY-LATER
                  </span>
                  <span className="text-[9px] font-plex-mono text-[#FF1744] bg-[#FF1744]/10 px-1.5 py-0.2 border border-[#FF1744]/20">
                    DEBT CEILING
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B] font-plex-sans">
                  Khoá bàn ngay khi tổng tiền chưa thanh toán đạt ngưỡng này.
                </p>
              </div>

              {/* Stepper + Direct Numeric Input */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 bg-[#12141C] p-1.5 border border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() =>
                      setThresholds((t) => ({
                        ...t,
                        unpaid_ceiling_vnd: Math.max(10000, t.unpaid_ceiling_vnd - 10000),
                      }))
                    }
                    disabled={thresholds.unpaid_ceiling_vnd <= 10000}
                    className="w-9 h-9 flex items-center justify-center bg-[#1C202E] hover:bg-[#252B3E] text-white border border-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <div className="flex-1 flex items-center justify-center gap-1">
                    <input
                      type="number"
                      step={10000}
                      min={10000}
                      max={10000000}
                      value={thresholds.unpaid_ceiling_vnd || ''}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setThresholds((t) => ({
                          ...t,
                          unpaid_ceiling_vnd: isNaN(val) ? 0 : val,
                        }));
                      }}
                      className="w-24 text-center font-plex-mono text-lg font-bold text-[#FF1744] bg-transparent outline-none tabular-nums"
                    />
                    <span className="text-[10px] font-plex-mono text-[#8E9EB5]">VNĐ</span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setThresholds((t) => ({
                        ...t,
                        unpaid_ceiling_vnd: Math.min(10000000, t.unpaid_ceiling_vnd + 10000),
                      }))
                    }
                    className="w-9 h-9 flex items-center justify-center bg-[#1C202E] hover:bg-[#252B3E] text-white border border-white/[0.06] transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick Value Chips */}
                <div className="flex items-center justify-between gap-1 text-[10px] font-plex-mono">
                  {[50000, 100000, 200000, 500000, 1000000].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setThresholds((t) => ({ ...t, unpaid_ceiling_vnd: v }))}
                      className={`flex-1 py-1 text-center border transition-colors cursor-pointer ${
                        thresholds.unpaid_ceiling_vnd === v
                          ? 'bg-[#FF1744] text-white font-bold border-[#FF1744]'
                          : 'bg-black/30 text-[#8E9EB5] border-white/[0.06] hover:text-white'
                      }`}
                    >
                      {(v / 1000).toFixed(0)}k
                    </button>
                  ))}
                </div>
              </div>

              {/* Validation Message */}
              {thresholds.unpaid_ceiling_vnd < 10000 ? (
                <div className="text-[10px] font-plex-mono text-[#FF1744] flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Tối thiểu 10.000 VNĐ
                </div>
              ) : thresholds.unpaid_ceiling_vnd > 2000000 ? (
                <div className="text-[10px] font-plex-mono text-[#FFB800] flex items-center gap-1">
                  <Info className="w-3 h-3" /> Trần nợ cao làm tăng rủi ro bùng tiền
                </div>
              ) : (
                <div className="text-[10px] font-plex-mono text-emerald-400 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Ngưỡng trần an toàn
                </div>
              )}
            </div>

            {/* CARD 4: CÒI BÁO ĐỘNG SOC (AUDIO SIREN) */}
            <div className="p-4 bg-[#0B0C10] border border-white/[0.08] flex flex-col justify-between space-y-4 group hover:border-emerald-500/40 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-plex-mono uppercase tracking-widest text-[#8E9EB5] flex items-center gap-1.5 font-bold">
                    <Bell className="w-3.5 h-3.5 text-emerald-400" />
                    CÒI BÁO ĐỘNG SOC
                  </span>
                  <span className="text-[9px] font-plex-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 border border-emerald-500/20">
                    SIREN
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B] font-plex-sans">
                  Tự động phát còi báo khi có giả mạo chữ ký hoặc leo thang quyền.
                </p>
              </div>

              {/* Toggle + Test Sound */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() =>
                    setThresholds((t) => ({ ...t, audio_alert_enabled: !t.audio_alert_enabled }))
                  }
                  className={`w-full flex items-center justify-between p-2.5 border transition-all cursor-pointer ${
                    thresholds.audio_alert_enabled
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                      : 'bg-[#12141C] border-white/[0.08] text-[#64748B]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {thresholds.audio_alert_enabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    <span className="font-plex-mono text-[11px] font-bold">
                      {thresholds.audio_alert_enabled ? 'BẬT — CÒI HÚ KÍCH HOẠT' : 'TẮT — IM LẶNG'}
                    </span>
                  </div>
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      thresholds.audio_alert_enabled ? 'bg-emerald-400 animate-ping' : 'bg-[#64748B]'
                    }`}
                  />
                </button>

                <button
                  type="button"
                  onClick={handleTestSiren}
                  disabled={isPlayingSound}
                  className="w-full py-2 bg-[#161822] hover:bg-[#1C202E] border border-white/[0.08] text-[10px] font-plex-mono text-[#CBD5E1] flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Volume2 className={`w-3.5 h-3.5 ${isPlayingSound ? 'text-[#FF1744] animate-ping' : ''}`} />
                  <span>{isPlayingSound ? 'ĐANG PHÁT ÂM THANH...' : 'TEST SOUND CÒI HÚ (PHÁT THỬ)'}</span>
                </button>
              </div>

              <div className="text-[10px] font-plex-mono text-[#8E9EB5] flex items-center gap-1">
                <Shield className="w-3 h-3 text-emerald-400" /> Kích hoạt qua Web Audio API
              </div>
            </div>
          </div>

          {/* Live Impact Formula HUD */}
          <div className="p-4 bg-gradient-to-r from-[#161822] to-[#10121A] border-l-4 border-l-[#FFB800] border-y border-r border-white/[0.08] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-plex-mono font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#FFB800]" />
                QUY TẮC THỰC THI BẢO MẬT HIỆN HÀNH (LIVE POLICY FORMULA)
              </span>
              <span className="text-[10px] font-plex-mono text-[#8E9EB5]">
                Tần suất trung bình: ~{impactAnalysis.avgSecondsPerOrder}s / 1 đơn
              </span>
            </div>
            <p className="text-[12px] font-plex-sans text-[#CBD5E1] leading-relaxed">
              Hệ thống sẽ tự động khoá bàn ngay khi tạo đơn thứ{' '}
              <span className="text-[#FFB800] font-bold font-plex-mono">
                {thresholds.max_pay_later_per_window + 1}
              </span>{' '}
              trong vòng{' '}
              <span className="text-[#FFB800] font-bold font-plex-mono">
                {thresholds.rate_limit_window_min} phút
              </span>{' '}
              (khoảng cách trung bình giữa các đơn: ~{impactAnalysis.avgSecondsPerOrder} giây) HOẶC khi tổng công nợ chưa thanh toán đạt{' '}
              <span className="text-[#FF1744] font-bold font-plex-mono">
                {thresholds.unpaid_ceiling_vnd.toLocaleString('vi-VN')} VNĐ
              </span>.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => handleApplyPreset(PRESETS[1])}
              className="w-full sm:w-auto px-4 py-3 bg-[#161822] hover:bg-[#1C202E] border border-white/[0.1] text-[#CBD5E1] hover:text-white font-plex-mono text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>KHÔI PHỤC MẶC ĐỊNH (TIÊU CHUẨN)</span>
            </button>

            <button
              type="submit"
              disabled={
                isPending ||
                thresholds.max_pay_later_per_window < 1 ||
                thresholds.rate_limit_window_min < 1 ||
                thresholds.unpaid_ceiling_vnd < 10000
              }
              className="w-full sm:flex-1 py-3.5 px-6 bg-[#FFB800] hover:bg-[#E6A700] text-[#0B0C10] font-plex-sans text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_24px_rgba(255,184,0,0.25)] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>ĐANG ÁP DỤNG CHÍNH SÁCH BẢO MẬT...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>LƯU & KÍCH HOẠT CHÍNH SÁCH BẢO MẬT TOÀN HỆ THỐNG</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
