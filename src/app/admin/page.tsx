'use client';

import { useState, useEffect, useTransition, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  getSocTelemetryLogsAction,
  getPlatformMetricsAction,
} from '@/actions/admin-actions';
import { SecurityLog } from '@/types/database';
import { Drawer } from 'vaul';
import {
  ShieldAlert,
  Terminal,
  Activity,
  DollarSign,
  Lock,
  Radio,
  RefreshCw,
  AlertTriangle,
  Search,
  X,
  Copy,
  Check,
  Eye,
  Layers,
  Zap,
  Wifi,
  ShieldCheck,
  Filter,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Info,
  Clock,
} from 'lucide-react';

const SEVERITY_META: Record<
  string,
  { color: string; bg: string; border: string; dot: string; glow: string }
> = {
  CRITICAL: {
    color: 'text-[#FF1744]',
    bg: 'bg-[#FF1744]/10',
    border: 'border-[#FF1744]/40',
    dot: 'bg-[#FF1744]',
    glow: 'shadow-[0_0_12px_rgba(255,23,68,0.25)]',
  },
  WARNING: {
    color: 'text-[#FFB800]',
    bg: 'bg-[#FFB800]/10',
    border: 'border-[#FFB800]/40',
    dot: 'bg-[#FFB800]',
    glow: 'shadow-[0_0_12px_rgba(255,184,0,0.25)]',
  },
  INFO: {
    color: 'text-[#E5BDDF]',
    bg: 'bg-[#E5BDDF]/10',
    border: 'border-[#E5BDDF]/30',
    dot: 'bg-[#E5BDDF]',
    glow: 'shadow-[0_0_12px_rgba(229,189,223,0.15)]',
  },
};

const EVENT_CATEGORY: Record<string, string> = {
  WEBHOOK_VERIFICATION_FAILED: 'FINANCE',
  PAY_LATER_CEILING_BLOCKED: 'FINANCE',
  UNPAID_CEILING_BLOCKED: 'FINANCE',
  MOCK_PAY_PROD_TRIGGERED: 'FINANCE',
  ORDER_PAID_SUCCESS: 'FINANCE',
  WEBHOOK_PAID: 'FINANCE',
  SESSION_PRIVILEGE_ESCALATION: 'AUTH',
  ADMIN_LOGIN_FAILED: 'AUTH',
  VIETQR_CONFIG_UPDATED: 'INTEGRITY',
  MENU_ITEM_STOCK_TOGGLED: 'INTEGRITY',
  RATE_LIMIT_ORDER_BLOCKED: 'SPAM',
  RATE_LIMIT_BLOCKED: 'SPAM',
  INVALID_QR_TOKEN_SCAN: 'SPAM',
  NEW_ORDER: 'LEGACY',
  PAY_LATER_APPROVED: 'LEGACY',
};

const THREAT_EXPLANATIONS: Record<
  string,
  { title: string; desc: string; remedy: string; level: 'HIGH' | 'MEDIUM' | 'LOW' }
> = {
  WEBHOOK_VERIFICATION_FAILED: {
    title: 'Phát hiện chữ ký giả mạo trên SePay Gateway (HMAC Tampering)',
    desc: 'Hệ thống nhận webhook báo thanh toán nhưng checksum không khớp Secret Key. Khả năng cao kẻ gian đang gửi request giả lập thanh toán.',
    remedy: 'Kiểm tra IP nguồn, đối soát mã giao dịch trên tài khoản ngân hàng thực.',
    level: 'HIGH',
  },
  SESSION_PRIVILEGE_ESCALATION: {
    title: 'Nỗ lực leo thang đặc quyền (Privilege Escalation)',
    desc: 'Session Token của khách hàng (Role: Customer/Anonymous) cố tình gọi API phê duyệt đơn hoặc quản trị hệ thống (/api/orders/approve).',
    remedy: 'Hệ thống đã tự động chặn truy cập. Theo dõi địa chỉ IP để đưa vào blacklist nếu lặp lại.',
    level: 'HIGH',
  },
  RATE_LIMIT_ORDER_BLOCKED: {
    title: 'Tấn công dồn dập đơn hàng Trả Sau (Order Flooding / Spam)',
    desc: 'Bàn hoặc IP liên tục gửi yêu cầu tạo đơn Pay-Later vượt quá ngưỡng cho phép trong thời gian ngắn.',
    remedy: 'Bàn đã bị khóa bảo mật tạm thời. Quản trị viên có thể vào tab Live Ops để kiểm tra và mở khóa.',
    level: 'MEDIUM',
  },
  INVALID_QR_TOKEN_SCAN: {
    title: 'Dò quét mã QR giả mạo (Brute-Force QR Scanning)',
    desc: 'Hệ thống ghi nhận request mang Token không tồn tại trong danh mục 30 bàn của quán.',
    remedy: 'Theo dõi dải IP, kiểm tra xem có thiết bị quét ngẫu nhiên URL bàn không.',
    level: 'MEDIUM',
  },
  VIETQR_CONFIG_UPDATED: {
    title: 'Thay đổi cấu hình nhận tiền VietQR',
    desc: 'Số tài khoản, ngân hàng thụ hưởng hoặc tên chủ tài khoản vừa được thay đổi.',
    remedy: 'Xác minh người thực hiện qua audit log để đảm bảo tiền không bị chuyển nhầm đích.',
    level: 'MEDIUM',
  },
  PAY_LATER_CEILING_BLOCKED: {
    title: 'Chặn đơn do vượt trần nợ an toàn',
    desc: 'Bàn tiếp tục đặt món nhưng tổng công nợ chưa thanh toán đã vượt mức trần tối đa.',
    remedy: 'Nhắc nhở nhân viên thu tiền bàn trước khi cho đặt thêm.',
    level: 'LOW',
  },
};

function formatTs(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatFullTs(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString('vi-VN')} ${d.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })}.${String(d.getMilliseconds()).padStart(3, '0')}`;
}

function JsonHighlight({ data }: { data: Record<string, any> | null }) {
  if (!data) return <span className="text-[#64748B]">null</span>;
  const json = JSON.stringify(data, null, 2);
  const highlighted = json
    .replace(/(\"[\w@./\-]+\")\s*:/g, '<span class="text-[#E5BDDF]">$1</span>:')
    .replace(/:\s*(\".*?\")/g, ': <span class="text-[#FFB800]">$1</span>')
    .replace(/:\s*(true|false)/g, ': <span class="text-emerald-400">$1</span>')
    .replace(/:\s*(\d+)/g, ': <span class="text-purple-400">$1</span>');
  return (
    <pre
      className="text-[11px] font-plex-mono leading-relaxed whitespace-pre-wrap break-all selection:bg-[#E5BDDF]/30"
      dangerouslySetInnerHTML={{ __html: highlighted }}
    />
  );
}

export default function AdminSocPage() {
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [metrics, setMetrics] = useState<{
    grossGmv: number;
    totalOrders: number;
    payNowCount: number;
    payLaterCount: number;
    blockedAttemptsCount: number;
    activeTablesCount: number;
    storeName: string;
  } | null>(null);

  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<SecurityLog | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(() => {
    startTransition(async () => {
      const [logList, metricData] = await Promise.all([
        getSocTelemetryLogsAction(filterSeverity, filterCategory, searchQuery),
        getPlatformMetricsAction(),
      ]);
      setLogs(logList);
      setMetrics(metricData);
    });
  }, [filterSeverity, filterCategory, searchQuery]);

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 4000);
    return () => clearInterval(timer);
  }, [loadData]);

  // Keyboard shortcut: Press '/' to focus search, 'Esc' to clear
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape' && searchQuery) {
        setSearchQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery]);

  const handleSelectLog = (log: SecurityLog) => {
    setSelectedLog(log);
    setDrawerOpen(true);
  };

  const handleCopyJson = () => {
    if (!selectedLog) return;
    navigator.clipboard.writeText(JSON.stringify(selectedLog.metadata, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFilterIp = (ip: string) => {
    setSearchQuery(ip);
    setDrawerOpen(false);
  };

  const handleFilterEventType = (eventType: string) => {
    setSearchQuery(eventType);
    setDrawerOpen(false);
  };

  // Anomaly stats
  const criticalCount = logs.filter((l) => l.severity === 'CRITICAL').length;
  const warningCount = logs.filter((l) => l.severity === 'WARNING').length;
  const spamCount = logs.filter(
    (l) => EVENT_CATEGORY[l.event_type] === 'SPAM' || l.event_type.includes('RATE_LIMIT')
  ).length;
  const suspiciousIps = useMemo(
    () => [
      ...new Set(
        logs
          .filter((l) => (l.severity === 'CRITICAL' || l.severity === 'WARNING') && l.ip_address)
          .map((l) => l.ip_address!)
      ),
    ],
    [logs]
  );

  // DEFCON Level calculation
  const defconLevel = criticalCount > 0 ? 2 : warningCount > 3 ? 3 : 5;
  const defconLabel =
    defconLevel === 2
      ? 'DEFCON 2 · ELEVATED THREAT'
      : defconLevel === 3
      ? 'DEFCON 3 · GUARDED'
      : 'DEFCON 5 · NORMAL / SECURE';
  const defconColor =
    defconLevel === 2
      ? 'text-[#FF1744] bg-[#FF1744]/10 border-[#FF1744]/30'
      : defconLevel === 3
      ? 'text-[#FFB800] bg-[#FFB800]/10 border-[#FFB800]/30'
      : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';

  const selectedMeta = selectedLog
    ? SEVERITY_META[selectedLog.severity] || SEVERITY_META.INFO
    : null;
  const threatInfo = selectedLog ? THREAT_EXPLANATIONS[selectedLog.event_type] : null;

  return (
    <div className="space-y-6">
      {/* ─── DEFCON & SYSTEM THREAT LEVEL STRIP ────────────────────────────── */}
      <div className="siem-panel p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-l-4 border-l-[#E5BDDF] bg-gradient-to-r from-[#161822] via-[#12141A] to-[#12141A]">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#E5BDDF]/10 text-[#E5BDDF] border border-[#E5BDDF]/20">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-plex-sans text-sm font-bold text-white tracking-wide">
                HỆ THỐNG PHÒNG THỦ AN NINH MẠNG LAYER 1 & 2
              </span>
              <span className={`px-2 py-0.5 font-plex-mono text-[10px] font-bold border ${defconColor}`}>
                {defconLabel}
              </span>
            </div>
            <p className="text-[11px] text-[#8E9EB5] font-plex-mono mt-0.5">
              Chống tấn công Replay Attack, giả mạo chữ ký Webhook SePay & Leo thang quyền người dùng
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-plex-mono text-[#64748B] self-end md:self-auto">
          <span>Auto-refresh:</span>
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block animate-ping" />
            4s LIVE
          </span>
        </div>
      </div>

      {/* ─── CORE KPI MATRIX (4 CARDS) ────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total GMV */}
        <div className="siem-panel siem-panel-interactive p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-plex-mono uppercase tracking-widest text-[#8E9EB5]">
              TỔNG DOANH THU HÔM NAY
            </span>
            <div className="p-1.5 bg-[#E5BDDF]/10 text-[#E5BDDF] border border-[#E5BDDF]/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3.5 font-plex-mono text-2xl font-bold text-white tabular-nums tracking-tight">
            {metrics?.grossGmv.toLocaleString('vi-VN') || '0'} <span className="text-sm font-normal text-[#8E9EB5]">VNĐ</span>
          </div>
          <div className="mt-2 text-[11px] text-[#E5BDDF] font-plex-mono flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-[#E5BDDF]" />
            <span>{metrics?.totalOrders || 0} giao dịch thành công</span>
          </div>
        </div>

        {/* Payment Allocation Split */}
        <div className="siem-panel siem-panel-interactive p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-plex-mono uppercase tracking-widest text-[#8E9EB5]">
              PHÂN BỔ THANH TOÁN
            </span>
            <div className="p-1.5 bg-[#E5BDDF]/10 text-[#E5BDDF] border border-[#E5BDDF]/20">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3.5 font-plex-mono text-2xl font-bold text-white flex items-center gap-3 tabular-nums">
            <span className="flex items-baseline gap-1">
              <span className="text-[#E5BDDF]">{metrics?.payNowCount || 0}</span>
              <span className="text-[10px] font-normal text-[#8E9EB5]">Pay-Now (VietQR)</span>
            </span>
            <span className="text-white/20">/</span>
            <span className="flex items-baseline gap-1">
              <span className="text-[#FFB800]">{metrics?.payLaterCount || 0}</span>
              <span className="text-[10px] font-normal text-[#8E9EB5]">Pay-Later</span>
            </span>
          </div>
          <div className="mt-2 text-[11px] text-[#8E9EB5] font-plex-mono">Tỉ lệ tiền mặt / Trả sau an toàn</div>
        </div>

        {/* Threat Blocks */}
        <div className="siem-panel siem-panel-interactive p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-plex-mono uppercase tracking-widest text-[#FF1744]">
              KHỐI CHẶN BẢO MẬT
            </span>
            <div className="p-1.5 bg-[#FF1744]/10 text-[#FF1744] border border-[#FF1744]/25">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3.5 font-plex-mono text-2xl font-bold text-[#FF1744] tabular-nums tracking-tight">
            {metrics?.blockedAttemptsCount || 0}{' '}
            <span className="text-xs font-normal text-[#8E9EB5]">cảnh báo chặn</span>
          </div>
          <div className="mt-2 text-[11px] text-[#FFB800] font-plex-mono flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Spam / Forgery / Escalation</span>
          </div>
        </div>

        {/* Active Tables Capacity */}
        <div className="siem-panel siem-panel-interactive p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-plex-mono uppercase tracking-widest text-[#8E9EB5]">
              BÀN ĐANG HOẠT ĐỘNG
            </span>
            <div className="p-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3.5 font-plex-mono text-2xl font-bold text-white tabular-nums tracking-tight">
            {metrics?.activeTablesCount || 0}{' '}
            <span className="text-xs font-normal text-[#8E9EB5]">/ 30 Bàn Online</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-400 font-plex-mono">Realtime QR Client Sessions</div>
        </div>
      </div>

      {/* ─── ANOMALY THREAT INTEL STRIP (3 INTERACTIVE CARDS) ─────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Critical Events */}
        <button
          onClick={() => {
            setFilterSeverity(filterSeverity === 'CRITICAL' ? 'ALL' : 'CRITICAL');
          }}
          className={`siem-panel p-4 text-left transition-all cursor-pointer ${
            criticalCount > 0
              ? 'border-[#FF1744]/40 bg-[#FF1744]/[0.04] hover:bg-[#FF1744]/[0.08]'
              : 'hover:bg-white/[0.02]'
          } ${filterSeverity === 'CRITICAL' ? 'ring-1 ring-[#FF1744]' : ''}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-plex-mono uppercase tracking-widest text-[#8E9EB5] flex items-center gap-1.5">
              <Zap className={`w-3.5 h-3.5 ${criticalCount > 0 ? 'text-[#FF1744]' : 'text-[#64748B]'}`} />
              SỰ KIỆN CRITICAL
            </span>
            <span className="text-[9px] font-plex-mono text-[#8E9EB5] hover:text-[#FF1744]">
              {filterSeverity === 'CRITICAL' ? 'ĐANG LỌC' : 'CLICK LỌC'}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span
              className={`font-plex-mono text-3xl font-bold tabular-nums ${
                criticalCount > 0 ? 'text-[#FF1744]' : 'text-[#555555]'
              }`}
            >
              {criticalCount}
            </span>
            <span className="text-[11px] font-plex-mono text-[#8E9EB5]">
              {criticalCount > 0 ? 'Cần xử lý ngay' : 'Không có vi phạm'}
            </span>
          </div>
          <p className="text-[10px] text-[#64748B] font-plex-sans mt-2">
            Webhook forgery, Privilege escalation
          </p>
        </button>

        {/* Anti-Spam Blocks */}
        <button
          onClick={() => {
            setFilterCategory(filterCategory === 'SPAM' ? 'ALL' : 'SPAM');
          }}
          className={`siem-panel p-4 text-left transition-all cursor-pointer ${
            spamCount > 0
              ? 'border-[#FFB800]/40 bg-[#FFB800]/[0.04] hover:bg-[#FFB800]/[0.08]'
              : 'hover:bg-white/[0.02]'
          } ${filterCategory === 'SPAM' ? 'ring-1 ring-[#FFB800]' : ''}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-plex-mono uppercase tracking-widest text-[#8E9EB5] flex items-center gap-1.5">
              <Wifi className={`w-3.5 h-3.5 ${spamCount > 0 ? 'text-[#FFB800]' : 'text-[#64748B]'}`} />
              ANTI-SPAM & RATE LIMITS
            </span>
            <span className="text-[9px] font-plex-mono text-[#8E9EB5] hover:text-[#FFB800]">
              {filterCategory === 'SPAM' ? 'ĐANG LỌC' : 'CLICK LỌC'}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span
              className={`font-plex-mono text-3xl font-bold tabular-nums ${
                spamCount > 0 ? 'text-[#FFB800]' : 'text-[#555555]'
              }`}
            >
              {spamCount}
            </span>
            <span className="text-[11px] font-plex-mono text-[#8E9EB5]">
              {spamCount > 0 ? 'Tự động chặn' : 'Ổn định'}
            </span>
          </div>
          <p className="text-[10px] text-[#64748B] font-plex-sans mt-2">
            Rate limit exceeded, QR token enumeration
          </p>
        </button>

        {/* Suspicious Client IPs */}
        <div
          className={`siem-panel p-4 ${
            suspiciousIps.length > 0 ? 'border-[#E5BDDF]/40 bg-[#E5BDDF]/[0.03]' : ''
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-plex-mono uppercase tracking-widest text-[#8E9EB5] flex items-center gap-1.5">
              <ShieldAlert className={`w-3.5 h-3.5 ${suspiciousIps.length > 0 ? 'text-[#E5BDDF]' : 'text-[#64748B]'}`} />
              IP ĐÁNG NGỜ (THREAT INTEL)
            </span>
            <span className="text-[9px] font-plex-mono text-[#8E9EB5]">
              {suspiciousIps.length} IPs
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span
              className={`font-plex-mono text-3xl font-bold tabular-nums ${
                suspiciousIps.length > 0 ? 'text-[#E5BDDF]' : 'text-[#555555]'
              }`}
            >
              {suspiciousIps.length}
            </span>
            {suspiciousIps.length > 0 && (
              <div className="flex flex-wrap gap-1.5 max-w-[200px] justify-end">
                {suspiciousIps.slice(0, 2).map((ip) => (
                  <button
                    key={ip}
                    onClick={() => setSearchQuery(ip)}
                    className="text-[9px] font-plex-mono px-1.5 py-0.5 bg-black/50 border border-white/[0.1] text-[#E5BDDF] hover:border-[#E5BDDF]/50 hover:bg-[#E5BDDF]/10 transition-colors cursor-pointer"
                    title={`Click để lọc IP ${ip}`}
                  >
                    {ip}
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="text-[10px] text-[#64748B] font-plex-sans mt-2">
            Ghi nhận từ các request vi phạm chữ ký hoặc sai role
          </p>
        </div>
      </div>

      {/* ─── LIVE AUDIT LOG FEED & TRIAGE ─────────────────────────────────── */}
      <div className="siem-panel overflow-hidden">
        {/* Log Panel Header */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] bg-[#12141C] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#E5BDDF]/10 text-[#E5BDDF] border border-[#E5BDDF]/20">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-plex-sans text-sm md:text-base font-bold text-white flex items-center gap-2">
                NHẬT KÝ AN NINH SIEM TELEMETRY STREAM
                <span className="w-2 h-2 bg-emerald-400 rounded-full inline-block animate-pulse" />
              </h3>
              <p className="text-[11px] text-[#8E9EB5] font-plex-mono">
                PostgreSQL JSONB Telemetry · Strict Whole-Word Query Engine · Click để xem chi tiết
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-[11px] font-plex-mono text-[#8E9EB5] bg-black/40 px-2.5 py-1 border border-white/[0.06]">
              {logs.length} LOG ENTRIES
            </span>
            <button
              onClick={loadData}
              disabled={isPending}
              className="p-1.5 bg-[#161822] border border-white/[0.08] text-[#8E9EB5] hover:text-[#E5BDDF] hover:border-[#E5BDDF]/40 transition-colors cursor-pointer"
              title="Làm mới log tức thì"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPending ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="p-3.5 sm:p-4 border-b border-white/[0.06] bg-[#0F1118] flex flex-wrap items-center gap-2.5">
          {/* Strict Search Bar */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#64748B]" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Tìm kiếm chính xác (IP, mã sự kiện, table ID... Gõ '/' để focus)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-16 py-2 bg-[#0B0C10] border border-white/[0.08] focus:border-[#E5BDDF]/50 text-[11px] font-plex-mono text-[#F1F5F9] outline-none placeholder:text-[#4B5563] transition-colors"
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-plex-mono text-[#8E9EB5] hover:text-white flex items-center gap-1 bg-white/[0.06] px-1.5 py-0.5 cursor-pointer"
              >
                <span>ESC</span>
                <X className="w-3 h-3" />
              </button>
            ) : (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-plex-mono text-[#4B5563] border border-white/[0.06] px-1 py-0.2">
                /
              </span>
            )}
          </div>

          {/* Severity Filters */}
          <div className="flex items-center gap-0.5 bg-[#0B0C10] border border-white/[0.08] p-0.5">
            {['ALL', 'INFO', 'WARNING', 'CRITICAL'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilterSeverity(lvl)}
                className={`px-2.5 py-1 text-[10px] font-plex-mono font-bold transition-all cursor-pointer ${
                  filterSeverity === lvl
                    ? lvl === 'CRITICAL'
                      ? 'bg-[#FF1744] text-white shadow-[0_0_12px_rgba(255,23,68,0.4)]'
                      : lvl === 'WARNING'
                      ? 'bg-[#FFB800] text-[#0B0C10] shadow-[0_0_12px_rgba(255,184,0,0.4)]'
                      : 'bg-[#E5BDDF] text-[#0B0C10] shadow-[0_0_12px_rgba(229,189,223,0.3)]'
                    : 'text-[#64748B] hover:text-[#CBD5E1]'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          {/* Category Filters */}
          <div className="flex items-center gap-0.5 bg-[#0B0C10] border border-white/[0.08] p-0.5">
            {['ALL', 'FINANCE', 'AUTH', 'INTEGRITY', 'SPAM'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-2.5 py-1 text-[10px] font-plex-mono font-medium transition-all cursor-pointer ${
                  filterCategory === cat
                    ? 'bg-white/[0.15] text-white font-bold'
                    : 'text-[#64748B] hover:text-[#CBD5E1]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* High-Density Log Feed Stream */}
        <div className="divide-y divide-white/[0.04] max-h-[580px] overflow-y-auto pr-0.5">
          {logs.length === 0 ? (
            <div className="text-center py-16 text-[#64748B] font-plex-mono text-xs flex flex-col items-center justify-center gap-2">
              <Terminal className="w-8 h-8 text-[#333333]" />
              <span>{isPending ? 'Đang truy vấn telemetry logs...' : 'Không có log nào khớp với bộ lọc hiện tại.'}</span>
              {(searchQuery || filterSeverity !== 'ALL' || filterCategory !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterSeverity('ALL');
                    setFilterCategory('ALL');
                  }}
                  className="mt-2 text-[11px] text-[#E5BDDF] underline hover:text-white"
                >
                  Xoá toàn bộ bộ lọc
                </button>
              )}
            </div>
          ) : (
            logs.map((log) => {
              const meta = SEVERITY_META[log.severity] || SEVERITY_META.INFO;
              const category = EVENT_CATEGORY[log.event_type] || 'SYSTEM';
              return (
                <button
                  key={log.id}
                  onClick={() => handleSelectLog(log)}
                  className="w-full text-left p-3 sm:p-3.5 hover:bg-white/[0.03] transition-colors group cursor-pointer block border-l-2 border-l-transparent hover:border-l-[#E5BDDF]"
                >
                  <div className="flex items-start gap-3">
                    <span className={`mt-1.5 w-2 h-2 flex-shrink-0 rounded-none ${meta.dot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span
                          className={`text-[9px] font-plex-mono font-bold px-1.5 py-0.2 ${meta.bg} ${meta.color} border ${meta.border}`}
                        >
                          {log.severity}
                        </span>
                        <span className="text-[9px] font-plex-mono text-[#F1F5F9] font-bold bg-white/[0.05] px-1.5 py-0.2 border border-white/[0.06]">
                          {log.event_type}
                        </span>
                        <span className="text-[9px] font-plex-mono text-[#8E9EB5] px-1.5 py-0.2 bg-black/40 border border-white/[0.04]">
                          {category}
                        </span>
                        {log.ip_address && (
                          <span className="text-[9px] font-plex-mono text-[#8E9EB5] flex items-center gap-1">
                            <span>IP:</span>
                            <span className="text-[#E5BDDF]">{log.ip_address}</span>
                          </span>
                        )}
                        {log.table_number && (
                          <span className="text-[9px] font-plex-mono text-emerald-400 bg-emerald-500/10 px-1 py-0.2 border border-emerald-500/20">
                            {log.table_number}
                          </span>
                        )}
                        <span className="text-[9px] font-plex-mono text-[#64748B] ml-auto tabular-nums">
                          {formatTs(log.created_at)}
                        </span>
                      </div>
                      <p className="text-[11.5px] text-[#CBD5E1] font-plex-sans line-clamp-2 group-hover:text-white transition-colors leading-relaxed">
                        {log.message}
                      </p>
                    </div>
                    <Eye className="w-4 h-4 text-[#4B5563] group-hover:text-[#E5BDDF] flex-shrink-0 transition-colors mt-1" />
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ─── ACTIONABLE JSONB TRIAGE DRAWER (VAUL RIGHT SHEET) ───────────── */}
      <Drawer.Root
        direction="right"
        open={drawerOpen}
        onOpenChange={(open) => {
          setDrawerOpen(open);
          if (!open) setTimeout(() => setSelectedLog(null), 300);
        }}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md" />
          <Drawer.Content
            className="fixed top-0 bottom-0 right-0 z-[201] w-full sm:w-[560px] h-full flex flex-col bg-[#10121A] border-l border-white/[0.1] shadow-[-24px_0_64px_rgba(0,0,0,0.95)] outline-none"
            style={{ borderRadius: 0 }}
          >
            {selectedLog && selectedMeta && (
              <>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4.5 border-b border-white/[0.08] bg-[#141722]">
                  <div>
                    <Drawer.Title className="font-plex-sans text-sm font-bold text-white tracking-wider flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-[#E5BDDF]" />
                      JSONB TELEMETRY TRIAGE
                    </Drawer.Title>
                    <p className="text-[11px] text-[#8E9EB5] font-plex-mono mt-0.5">
                      Log ID: {selectedLog.id}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyJson}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1C202E] border border-white/[0.1] text-[11px] font-plex-mono text-[#CBD5E1] hover:text-[#E5BDDF] hover:border-[#E5BDDF]/40 transition-colors cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'COPIED' : 'COPY JSON'}</span>
                    </button>
                    <Drawer.Close asChild>
                      <button className="p-1.5 bg-[#1C202E] border border-white/[0.1] text-[#8E9EB5] hover:text-white transition-colors cursor-pointer">
                        <X className="w-4 h-4" />
                      </button>
                    </Drawer.Close>
                  </div>
                </div>

                {/* Event Summary & Security Threat Analysis */}
                <div className="px-6 py-4 border-b border-white/[0.08] bg-[#0E1017] space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div
                      className={`inline-flex items-center gap-1.5 text-[10px] font-plex-mono font-bold px-2.5 py-1 ${selectedMeta.bg} ${selectedMeta.color} border ${selectedMeta.border}`}
                    >
                      <span className={`w-1.5 h-1.5 ${selectedMeta.dot}`} />
                      {selectedLog.severity} · {selectedLog.event_type}
                    </div>
                    <span className="text-[11px] font-plex-mono text-[#8E9EB5] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatFullTs(selectedLog.created_at)}
                    </span>
                  </div>

                  <p className="text-[12px] text-[#F1F5F9] font-plex-sans leading-relaxed">
                    {selectedLog.message}
                  </p>

                  {/* Threat Intelligence Explanation */}
                  {threatInfo && (
                    <div
                      className={`p-3.5 border ${
                        threatInfo.level === 'HIGH'
                          ? 'border-[#FF1744]/30 bg-[#FF1744]/[0.06]'
                          : threatInfo.level === 'MEDIUM'
                          ? 'border-[#FFB800]/30 bg-[#FFB800]/[0.06]'
                          : 'border-[#E5BDDF]/30 bg-[#E5BDDF]/[0.06]'
                      } space-y-1.5 text-[11px]`}
                    >
                      <div className="flex items-center gap-1.5 font-plex-sans font-bold text-white">
                        <ShieldAlert
                          className={`w-3.5 h-3.5 ${
                            threatInfo.level === 'HIGH'
                              ? 'text-[#FF1744]'
                              : threatInfo.level === 'MEDIUM'
                              ? 'text-[#FFB800]'
                              : 'text-[#E5BDDF]'
                          }`}
                        />
                        <span>{threatInfo.title}</span>
                      </div>
                      <p className="text-[#CBD5E1] font-plex-sans leading-relaxed">
                        {threatInfo.desc}
                      </p>
                      <p className="text-[#8E9EB5] font-plex-mono text-[10px] pt-1 border-t border-white/[0.04]">
                        <span className="text-white font-bold">Khuyến nghị xử lý:</span> {threatInfo.remedy}
                      </p>
                    </div>
                  )}

                  {/* Quick Triage Actions */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {selectedLog.ip_address && (
                      <button
                        onClick={() => handleFilterIp(selectedLog.ip_address!)}
                        className="px-2.5 py-1 bg-black/40 hover:bg-[#E5BDDF]/10 border border-white/[0.1] hover:border-[#E5BDDF]/40 text-[10px] font-plex-mono text-[#E5BDDF] flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Filter className="w-3 h-3" />
                        <span>Lọc tất cả log IP: {selectedLog.ip_address}</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleFilterEventType(selectedLog.event_type)}
                      className="px-2.5 py-1 bg-black/40 hover:bg-white/[0.06] border border-white/[0.1] text-[10px] font-plex-mono text-[#CBD5E1] flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Filter className="w-3 h-3" />
                      <span>Lọc theo mã: {selectedLog.event_type}</span>
                    </button>
                    {selectedLog.table_id && (
                      <Link
                        href="/admin/operations"
                        className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-[10px] font-plex-mono text-emerald-400 flex items-center gap-1 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Xem Node Bàn trên Live Ops</span>
                      </Link>
                    )}
                  </div>
                </div>

                {/* Structured JSON Payload Body */}
                <div className="flex-1 overflow-y-auto p-6 bg-[#0B0C10] font-plex-mono">
                  <div className="flex items-center justify-between mb-3 text-[10px] text-[#8E9EB5] border-b border-white/[0.06] pb-2">
                    <span>RAW POSTGRESQL JSONB PAYLOAD</span>
                    <span>GIN INDEX ENABLED</span>
                  </div>
                  <JsonHighlight data={selectedLog.metadata} />
                </div>
              </>
            )}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}
