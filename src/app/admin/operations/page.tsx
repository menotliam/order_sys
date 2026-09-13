'use client';

import { useState, useEffect, useTransition, useCallback, useRef, useMemo } from 'react';
import { getOperationsOverviewAction, resetTableSecurityAction } from '@/actions/admin-actions';
import { CafeTable, CashflowDataPoint } from '@/types/database';
import { AnimatePresence, motion } from 'motion/react';
import { Drawer } from 'vaul';
import { toast } from 'sonner';
import {
  Activity,
  X,
  ShieldOff,
  Loader2,
  TrendingUp,
  DollarSign,
  RefreshCw,
  Wifi,
  WifiOff,
  Clock,
  AlertTriangle,
  CheckCircle,
  Copy,
  Check,
  ShieldAlert,
  Radio,
  Sparkles,
  Zap,
} from 'lucide-react';

const TABLE_STATUS_META: Record<
  string,
  {
    label: string;
    sublabel: string;
    color: string;
    bg: string;
    border: string;
    dot: string;
    icon: typeof Wifi;
    ping?: boolean;
  }
> = {
  idle: {
    label: 'IDLE',
    sublabel: 'Sẵn sàng phục vụ',
    color: 'text-[#64748B]',
    bg: 'bg-[#10121A]',
    border: 'border-white/[0.06]',
    dot: 'bg-[#64748B]',
    icon: Wifi,
  },
  occupied: {
    label: 'ACTIVE',
    sublabel: 'Khách đang order',
    color: 'text-[#E5BDDF]',
    bg: 'bg-[#E5BDDF]/[0.06]',
    border: 'border-[#E5BDDF]/40',
    dot: 'bg-[#E5BDDF]',
    icon: Activity,
    ping: true,
  },
  pending_pay_later: {
    label: 'PENDING DEBT',
    sublabel: 'Chờ thanh toán',
    color: 'text-[#FFB800]',
    bg: 'bg-[#FFB800]/[0.06]',
    border: 'border-[#FFB800]/40',
    dot: 'bg-[#FFB800]',
    icon: Clock,
    ping: true,
  },
  blocked_rate_limit: {
    label: 'BLOCKED: SPAM',
    sublabel: 'Khoá Rate Limit',
    color: 'text-[#FF1744]',
    bg: 'bg-[#FF1744]/[0.08]',
    border: 'border-[#FF1744]/50',
    dot: 'bg-[#FF1744]',
    icon: WifiOff,
    ping: true,
  },
  blocked_debt: {
    label: 'BLOCKED: DEBT',
    sublabel: 'Vượt trần nợ',
    color: 'text-purple-400',
    bg: 'bg-purple-500/[0.08]',
    border: 'border-purple-500/50',
    dot: 'bg-purple-400',
    icon: AlertTriangle,
    ping: true,
  },
};

// ─── Cashflow Chart Component ───────────────────────────────────────────────
function CashflowChart({ data }: { data: CashflowDataPoint[] }) {
  const width = 860;
  const height = 180;
  const pad = { top: 25, right: 25, bottom: 35, left: 65 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;

  const { points, polyline, fillPath, xStep, maxRev, peakPoint } = useMemo(() => {
    if (data.length < 2) {
      return { points: [], polyline: '', fillPath: '', xStep: 0, maxRev: 1, peakPoint: null };
    }
    const mx = Math.max(...data.map((d) => d.revenue), 1);
    const xs = chartW / (data.length - 1);
    const pts = data.map((d, i) => ({
      x: pad.left + i * xs,
      y: pad.top + chartH - (d.revenue / mx) * chartH,
      d,
    }));
    const poly = pts.map((p) => `${p.x},${p.y}`).join(' ');
    const fill =
      `M${pad.left},${pad.top + chartH} ` +
      pts.map((p) => `L${p.x},${p.y}`).join(' ') +
      ` L${pad.left + chartW},${pad.top + chartH} Z`;

    const peak = pts.reduce((prev, curr) => (curr.d.revenue > prev.d.revenue ? curr : prev), pts[0]);
    return { points: pts, polyline: poly, fillPath: fill, xStep: xs, maxRev: mx, peakPoint: peak };
  }, [data, chartW, chartH]);

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const hovered = hoveredIndex !== null ? points[hoveredIndex] : null;

  if (data.length < 2) {
    return (
      <div className="py-12 text-center text-[#64748B] font-plex-mono text-xs">
        Chưa có đủ dữ liệu giao dịch để vẽ biểu đồ dòng tiền.
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        onMouseLeave={() => setHoveredIndex(null)}
      >
        <defs>
          <linearGradient id="cashflowGrad2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E5BDDF" stopOpacity="0.35" />
            <stop offset="60%" stopColor="#E5BDDF" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#E5BDDF" stopOpacity="0" />
          </linearGradient>
          <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Grid lines */}
        {[0.25, 0.5, 0.75, 1].map((frac) => {
          const y = pad.top + chartH * (1 - frac);
          return (
            <g key={frac}>
              <line
                x1={pad.left}
                y1={y}
                x2={pad.left + chartW}
                y2={y}
                stroke="rgba(255,255,255,0.05)"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <text
                x={pad.left - 10}
                y={y + 3.5}
                textAnchor="end"
                fontSize="9"
                fill="#8E9EB5"
                fontFamily="var(--font-plex-mono), monospace"
              >
                {((maxRev * frac) / 1000).toFixed(0)}k
              </text>
            </g>
          );
        })}

        {/* Baseline */}
        <line
          x1={pad.left}
          y1={pad.top + chartH}
          x2={pad.left + chartW}
          y2={pad.top + chartH}
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1"
        />

        {/* X labels */}
        {points.map((p, i) => (
          <text
            key={p.d.time}
            x={p.x}
            y={height - 8}
            textAnchor="middle"
            fontSize="9"
            fill={hoveredIndex === i ? '#E5BDDF' : '#8E9EB5'}
            fontWeight={hoveredIndex === i ? 'bold' : 'normal'}
            fontFamily="var(--font-plex-mono), monospace"
          >
            {p.d.time}
          </text>
        ))}

        {/* Gradient fill */}
        <path d={fillPath} fill="url(#cashflowGrad2)" />

        {/* Line with neon filter */}
        <polyline
          points={polyline}
          fill="none"
          stroke="#E5BDDF"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#neonGlow)"
        />

        {/* Hover Crosshair vertical bar */}
        {hovered && (
          <line
            x1={hovered.x}
            y1={pad.top}
            x2={hovered.x}
            y2={pad.top + chartH}
            stroke="#E5BDDF"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
        )}

        {/* Peak indicator */}
        {peakPoint && hoveredIndex === null && (
          <g>
            <circle cx={peakPoint.x} cy={peakPoint.y} r="5" fill="#E5BDDF" opacity="0.3" className="animate-ping" />
            <circle cx={peakPoint.x} cy={peakPoint.y} r="3" fill="#E5BDDF" stroke="#0B0C10" strokeWidth="1.5" />
          </g>
        )}

        {/* Hover zones + data points */}
        {points.map((p, i) => (
          <g key={i} onMouseEnter={() => setHoveredIndex(i)} className="cursor-crosshair">
            <rect
              x={p.x - xStep / 2}
              y={pad.top}
              width={xStep}
              height={chartH}
              fill="transparent"
            />
            <circle
              cx={p.x}
              cy={p.y}
              r={hoveredIndex === i ? 5 : 3}
              fill={hoveredIndex === i ? '#FFFFFF' : '#E5BDDF'}
              stroke="#0B0C10"
              strokeWidth="2"
              style={{ transition: 'r 120ms cubic-bezier(0.23, 1, 0.32, 1)' }}
            />
          </g>
        ))}
      </svg>

      {/* Floating HUD Tooltip */}
      {hovered && (
        <div
          className="absolute top-3 right-4 bg-[#12141C] border border-[#E5BDDF]/40 px-3.5 py-2 text-[11px] font-plex-mono pointer-events-none z-10 shadow-[0_8px_32px_rgba(0,0,0,0.8)]"
        >
          <div className="text-[#8E9EB5] text-[10px] flex items-center justify-between gap-4">
            <span>MỐC THỜI GIAN:</span>
            <span className="text-[#E5BDDF] font-bold">{hovered.d.time}</span>
          </div>
          <div className="text-white text-sm font-bold mt-0.5 tabular-nums">
            {hovered.d.revenue.toLocaleString('vi-VN')} VNĐ
          </div>
          <div className="text-emerald-400 text-[10px] mt-0.5">
            {hovered.d.orderCount} đơn hàng ghi nhận
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Operations Page ───────────────────────────────────────────────────
export default function AdminOperationsPage() {
  const [tables, setTables] = useState<CafeTable[]>([]);
  const [cashflow, setCashflow] = useState<CashflowDataPoint[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [selectedTable, setSelectedTable] = useState<CafeTable | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isResetting, setIsResetting] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const selectedTableRef = useRef<CafeTable | null>(null);
  selectedTableRef.current = selectedTable;

  const loadData = useCallback(() => {
    startTransition(async () => {
      const data = await getOperationsOverviewAction();
      setTables(data.tables);
      setCashflow(data.cashflow);
      setTotalRevenue(data.totalRevenue);
      setTotalOrders(data.totalOrders);
      const current = selectedTableRef.current;
      if (current) {
        const updated = data.tables.find((t) => t.id === current.id);
        if (updated) setSelectedTable(updated);
      }
    });
  }, []);

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 5000);
    return () => clearInterval(timer);
  }, [loadData]);

  const handleTableClick = (table: CafeTable) => {
    setSelectedTable(table);
    setDrawerOpen(true);
  };

  const handleCopyToken = () => {
    if (!selectedTable) return;
    navigator.clipboard.writeText(selectedTable.qr_token);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleReset = async () => {
    if (!selectedTable) return;
    setIsResetting(true);
    const result = await resetTableSecurityAction(selectedTable.id);
    if (result.success) {
      toast.success(`${selectedTable.table_number} ĐÃ ĐƯỢC MỞ KHOÁ BẢO MẬT`, {
        description: 'Đã reset ngưỡng Rate Limit & công nợ. Bàn đã chuyển về trạng thái sẵn sàng.',
        duration: 4000,
        icon: <ShieldOff className="w-4 h-4 text-emerald-400" />,
      });
      setTimeout(() => {
        loadData();
        if (result.table) setSelectedTable(result.table);
      }, 400);
    }
    setIsResetting(false);
  };

  const blockedCount = tables.filter(
    (t) => t.status === 'blocked_rate_limit' || t.status === 'blocked_debt'
  ).length;
  const activeCount = tables.filter(
    (t) => t.status === 'occupied' || t.status === 'pending_pay_later'
  ).length;

  const selectedMeta = selectedTable
    ? TABLE_STATUS_META[selectedTable.status] || TABLE_STATUS_META.idle
    : null;
  const isBlocked = selectedTable
    ? selectedTable.status === 'blocked_rate_limit' || selectedTable.status === 'blocked_debt'
    : false;

  return (
    <div className="space-y-6">
      {/* ─── HEADER STATS RIBBON ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {[
          {
            label: 'DOANH THU HÔM NAY',
            value: totalRevenue.toLocaleString('vi-VN') + ' VNĐ',
            color: 'text-[#E5BDDF]',
            icon: DollarSign,
            bg: 'bg-[#E5BDDF]/10',
            border: 'border-[#E5BDDF]/20',
          },
          {
            label: 'TỔNG ĐƠN HÀNG',
            value: String(totalOrders) + ' đơn',
            color: 'text-[#F1F5F9]',
            icon: Activity,
            bg: 'bg-white/[0.06]',
            border: 'border-white/[0.08]',
          },
          {
            label: 'BÀN ĐANG HOẠT ĐỘNG',
            value: String(activeCount) + ' / ' + tables.length + ' bàn',
            color: 'text-emerald-400',
            icon: Wifi,
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/25',
          },
          {
            label: 'BÀN BỊ KHOÁ AN NINH',
            value: String(blockedCount) + ' bàn',
            color: blockedCount > 0 ? 'text-[#FF1744]' : 'text-[#64748B]',
            icon: WifiOff,
            bg: blockedCount > 0 ? 'bg-[#FF1744]/10' : 'bg-white/[0.04]',
            border: blockedCount > 0 ? 'border-[#FF1744]/30' : 'border-white/[0.06]',
          },
        ].map((stat) => (
          <div key={stat.label} className="siem-panel siem-panel-interactive p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-plex-mono uppercase tracking-widest text-[#8E9EB5]">
                {stat.label}
              </span>
              <div className={`p-1.5 ${stat.bg} border ${stat.border}`}>
                <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
              </div>
            </div>
            <div className={`font-plex-mono text-xl lg:text-2xl font-bold tabular-nums ${stat.color}`}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* ─── LIVE CASHFLOW REVENUE TREND CHART ───────────────────────────── */}
      <div className="siem-panel p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#E5BDDF]/10 text-[#E5BDDF] border border-[#E5BDDF]/20">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-plex-sans text-sm md:text-base font-bold text-white flex items-center gap-2">
                BIỂU ĐỒ XU HƯỚNG DÒNG TIỀN VÀ TẦN SUẤT ĐƠN HÀNG
                <span className="text-[10px] font-plex-mono text-[#E5BDDF] bg-[#E5BDDF]/10 px-2 py-0.5 border border-[#E5BDDF]/20">
                  ROLLING 12H
                </span>
              </h3>
              <p className="text-[11px] text-[#8E9EB5] font-plex-mono">
                Doanh thu tích lũy thời gian thực · Cập nhật tự động sau mỗi giao dịch VietQR
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={loadData}
              disabled={isPending}
              className="p-1.5 bg-[#161822] border border-white/[0.08] text-[#8E9EB5] hover:text-[#E5BDDF] hover:border-[#E5BDDF]/40 transition-colors cursor-pointer"
              title="Làm mới dữ liệu biểu đồ"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPending ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <CashflowChart data={cashflow} />
      </div>

      {/* ─── 30-NODE TACTICAL TABLE MAP ──────────────────────────────────── */}
      <div className="siem-panel p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="font-plex-sans text-sm md:text-base font-bold text-white flex items-center gap-2">
                SƠ ĐỒ CHIẾN THUẬT BÀN — TACTICAL 30-NODE MAP
                <span className="text-[10px] font-plex-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/20">
                  {tables.length} NODES ONLINE
                </span>
              </h3>
              <p className="text-[11px] text-[#8E9EB5] font-plex-mono">
                Click vào node bất kỳ để kiểm tra telemetry session hoặc reset bảo mật khẩn cấp
              </p>
            </div>
          </div>

          {/* Tactical Legend */}
          <div className="flex flex-wrap items-center gap-3 text-[10px] font-plex-mono bg-black/50 px-3 py-2 border border-white/[0.06]">
            {Object.entries(TABLE_STATUS_META).map(([status, meta]) => (
              <div key={status} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 ${meta.dot} inline-block`} />
                <span className="text-[#CBD5E1]">{meta.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 30 Nodes Grid */}
        <motion.div
          layout
          className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-10 gap-2.5"
        >
          <AnimatePresence mode="popLayout">
            {tables.map((table, i) => {
              const meta = TABLE_STATUS_META[table.status] || TABLE_STATUS_META.idle;
              const Icon = meta.icon;
              const isSelected = selectedTable?.id === table.id;
              const isThreat =
                table.status === 'blocked_rate_limit' || table.status === 'blocked_debt';

              return (
                <motion.button
                  key={table.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{
                    opacity: 1,
                    scale: isSelected ? 1.04 : 1,
                    transition: {
                      opacity: { duration: 0.2 },
                      scale: { type: 'spring', stiffness: 400, damping: 28 },
                      delay: i * 0.008,
                    },
                  }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                  whileHover={{
                    scale: isSelected ? 1.04 : 1.03,
                    transition: { type: 'spring', stiffness: 500, damping: 25 },
                  }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleTableClick(table)}
                  className={`relative aspect-square border p-2 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    meta.bg
                  } ${meta.border} ${
                    isSelected
                      ? 'ring-2 ring-[#E5BDDF] ring-offset-2 ring-offset-[#0B0C10] shadow-[0_0_16px_rgba(229,189,223,0.35)]'
                      : 'hover:border-[#E5BDDF]/50'
                  }`}
                >
                  {/* Pulsing Dot if active or threat */}
                  {meta.ping && (
                    <span
                      className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 ${meta.dot} rounded-none siem-radar-ping`}
                    />
                  )}

                  <Icon className={`w-4 h-4 ${meta.color}`} />
                  <span className={`text-[11px] font-plex-mono font-bold leading-none ${meta.color}`}>
                    {table.table_number.replace('Bàn ', '')}
                  </span>
                  <span className="text-[8px] font-plex-mono text-[#8E9EB5] truncate max-w-full">
                    {meta.label}
                  </span>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* ─── TABLE SECURITY CONTROL DRAWER (VAUL RIGHT SHEET) ────────────── */}
      <Drawer.Root
        direction="right"
        open={drawerOpen}
        onOpenChange={(open) => {
          setDrawerOpen(open);
          if (!open) setTimeout(() => setSelectedTable(null), 300);
        }}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md" />
          <Drawer.Content
            className="fixed top-0 bottom-0 right-0 z-[201] w-full sm:w-[500px] h-full flex flex-col bg-[#10121A] border-l border-white/[0.1] shadow-[-24px_0_64px_rgba(0,0,0,0.95)] outline-none"
            style={{ borderRadius: 0 }}
          >
            {selectedTable && selectedMeta && (
              <>
                {/* Header */}
                <div
                  className={`p-6 border-b border-white/[0.08] ${
                    isBlocked ? 'bg-[#FF1744]/[0.08]' : 'bg-[#141722]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-12 h-12 ${selectedMeta.bg} border ${selectedMeta.border} flex items-center justify-center`}
                      >
                        <selectedMeta.icon className={`w-6 h-6 ${selectedMeta.color}`} />
                      </div>
                      <div>
                        <Drawer.Title className="font-plex-sans text-xl font-bold text-white flex items-center gap-2">
                          {selectedTable.table_number}
                          <span
                            className={`text-[10px] font-plex-mono px-2 py-0.5 border ${selectedMeta.bg} ${selectedMeta.color} ${selectedMeta.border}`}
                          >
                            NODE ONLINE
                          </span>
                        </Drawer.Title>
                        <span className={`text-[11px] font-plex-mono font-bold ${selectedMeta.color}`}>
                          {selectedMeta.label} — {selectedMeta.sublabel}
                        </span>
                      </div>
                    </div>
                    <Drawer.Close asChild>
                      <button className="p-2 bg-[#1C202E] border border-white/[0.1] text-[#8E9EB5] hover:text-white transition-colors cursor-pointer">
                        <X className="w-4 h-4" />
                      </button>
                    </Drawer.Close>
                  </div>
                </div>

                {/* Node Telemetry Details */}
                <div className="p-6 space-y-4 flex-1 overflow-y-auto">
                  {/* QR Token */}
                  <div className="p-3 bg-black/40 border border-white/[0.06] space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-plex-mono text-[#8E9EB5]">
                      <span>MÃ QR TOKEN BẢO MẬT</span>
                      <button
                        onClick={handleCopyToken}
                        className="text-[10px] text-[#E5BDDF] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {copiedToken ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedToken ? 'ĐÃ COPY' : 'COPY'}</span>
                      </button>
                    </div>
                    <div className="text-[12px] font-plex-mono text-[#F1F5F9] truncate bg-white/[0.03] p-2 border border-white/[0.04]">
                      {selectedTable.qr_token}
                    </div>
                  </div>

                  {/* Security Status Box */}
                  <div className="border border-white/[0.08] divide-y divide-white/[0.06] font-plex-mono text-[11px]">
                    <div className="p-3 flex items-center justify-between">
                      <span className="text-[#8E9EB5]">Node ID:</span>
                      <span className="text-white">{selectedTable.id}</span>
                    </div>
                    <div className="p-3 flex items-center justify-between">
                      <span className="text-[#8E9EB5]">Trạng Thái Hiện Tại:</span>
                      <span className={`font-bold ${selectedMeta.color}`}>{selectedMeta.label}</span>
                    </div>
                    <div className="p-3 flex items-center justify-between">
                      <span className="text-[#8E9EB5]">Thời Gian Khởi Tạo:</span>
                      <span className="text-white">{new Date(selectedTable.created_at).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>

                  {/* Threat Warning Alert Box */}
                  {isBlocked && (
                    <div
                      className={`p-4 border ${selectedMeta.border} ${selectedMeta.bg} space-y-2 text-[12px]`}
                    >
                      <div className="flex items-center gap-2 font-bold text-white">
                        <ShieldAlert className="w-4 h-4 text-[#FF1744]" />
                        <span>CẢNH BÁO BẢO MẬT LAYER 1 ĐANG KÍCH HOẠT</span>
                      </div>
                      <p className="text-[#CBD5E1] font-plex-sans leading-relaxed">
                        {selectedTable.status === 'blocked_rate_limit'
                          ? 'Bàn này đang bị tạm khoá do liên tục gửi request đặt đơn Pay-Later vượt quá ngưỡng cho phép (Rate Limit Flooding). Nhấn nút bên dưới để giải phóng bàn.'
                          : 'Bàn này đang bị tạm khoá do tổng công nợ chưa thanh toán đã vượt trần nợ an toàn quy định. Nhấn nút bên dưới để xoá nợ và mở khoá.'}
                      </p>
                    </div>
                  )}

                  {!isBlocked && (
                    <div className="p-4 bg-emerald-500/[0.05] border border-emerald-500/20 text-[11px] font-plex-sans text-[#CBD5E1] flex items-center gap-2.5">
                      <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>Node bàn hoạt động bình thường, không có dấu hiệu bất thường về bảo mật.</span>
                    </div>
                  )}
                </div>

                {/* Reset Action Button */}
                <div className="p-6 border-t border-white/[0.08] bg-[#0E1017]">
                  <button
                    onClick={handleReset}
                    disabled={isResetting || !isBlocked}
                    className={`w-full py-3.5 font-plex-sans text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isBlocked
                        ? 'bg-[#FF1744] hover:bg-[#E0102E] text-white shadow-[0_0_24px_rgba(255,23,68,0.4)] active:scale-[0.98]'
                        : 'bg-[#1C202E] text-[#555555] border border-white/[0.04] cursor-not-allowed'
                    }`}
                  >
                    {isResetting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>ĐANG GIẢI PHÓNG BẢO MẬT...</span>
                      </>
                    ) : (
                      <>
                        <ShieldOff className="w-4 h-4" />
                        <span>RESET BẢO MẬT & MỞ KHOÁ BÀN</span>
                      </>
                    )}
                  </button>
                  {!isBlocked && (
                    <p className="text-center text-[10px] text-[#64748B] font-plex-mono mt-2">
                      Bàn đang hoạt động bình thường — không yêu cầu can thiệp
                    </p>
                  )}
                </div>
              </>
            )}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}
