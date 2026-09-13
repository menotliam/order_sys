'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useTransition } from 'react';
import { Toaster, toast } from 'sonner';
import {
  ShieldAlert,
  Terminal,
  Radio,
  Home,
  Store,
  Siren,
  Activity,
  Settings,
  Loader2,
  ChevronDown,
  Cpu,
  Lock,
  Flame,
  ShieldCheck,
} from 'lucide-react';
import { simulateSecurityEventAction, getStoreConfigAction } from '@/actions/admin-actions';

const SIMULATE_EVENTS = [
  {
    type: 'SESSION_PRIVILEGE_ESCALATION',
    label: 'Privilege Escalation Attack',
    desc: 'Customer session attempted Staff Dashboard API /api/orders/approve',
    severity: 'CRITICAL',
  },
  {
    type: 'RATE_LIMIT_ORDER_BLOCKED',
    label: 'Pay-Later Flood Attack (Rate Limit)',
    desc: 'Table 05 exceeded rate limit window (3 orders in 4 mins)',
    severity: 'WARNING',
  },
  {
    type: 'WEBHOOK_VERIFICATION_FAILED',
    label: 'Webhook HMAC Signature Forgery',
    desc: 'SePay payload signature mismatch / tampering detected',
    severity: 'CRITICAL',
  },
  {
    type: 'INVALID_QR_TOKEN_SCAN',
    label: 'Brute-force QR Token Scan',
    desc: 'Non-existent table token scan detected from suspicious IP',
    severity: 'WARNING',
  },
];

export default function AdminSocLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [showAttackMenu, setShowAttackMenu] = useState(false);
  const [storeName, setStoreName] = useState('—');
  const [audioAlertEnabled, setAudioAlertEnabled] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [currentTime, setCurrentTime] = useState('');
  const [utcTime, setUtcTime] = useState('');

  // Realtime Tactical Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
      setUtcTime(
        now.toISOString().slice(11, 19) + ' UTC'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    getStoreConfigAction()
      .then(({ store }) => {
        setStoreName(store.name);
        setAudioAlertEnabled(store.security_thresholds?.audio_alert_enabled ?? false);
      })
      .catch(() => setStoreName('—'));
  }, []);

  const handleSimulate = (eventType: string) => {
    setShowAttackMenu(false);
    startTransition(async () => {
      await simulateSecurityEventAction(eventType);
      toast.error(`SIMULATED ATTACK: ${eventType}`, {
        description: 'Threat telemetry injected into SIEM audit stream.',
        duration: 4500,
        icon: <Siren className="w-4 h-4 text-[#FF1744]" />,
      });
      if (audioAlertEnabled) {
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
      }
    });
  };

  const navTabs = [
    {
      href: '/admin',
      label: 'SIEM ANOMALY & TELEMETRY',
      tag: 'LOG STREAM',
      icon: Terminal,
      active: pathname === '/admin',
    },
    {
      href: '/admin/operations',
      label: 'LIVE OPS & NODE MAP',
      tag: '30 NODES',
      icon: Activity,
      active: pathname === '/admin/operations',
    },
    {
      href: '/admin/config',
      label: 'SYS CONFIG & POLICIES',
      tag: 'SECURITY RULES',
      icon: Settings,
      active: pathname === '/admin/config',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0A0B0E] text-[#F1F5F9] flex flex-col selection:bg-[#E5BDDF]/20 selection:text-[#E5BDDF]">
      {/* Tactical Notification Toaster */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#12141A',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#F1F5F9',
            fontFamily: 'var(--font-plex-mono), monospace',
            fontSize: '12px',
            borderRadius: '0px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
          },
          classNames: {
            error: 'border-l-4 border-l-[#FF1744]',
            success: 'border-l-4 border-l-[#10B981]',
          },
        }}
        theme="dark"
      />

      {/* Top SOC Master Command Header */}
      <header className="sticky top-0 z-50 bg-[#0E1017]/95 backdrop-blur-xl border-b border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.7)]">
        {/* Main Header Bar */}
        <div className="max-w-[1440px] mx-auto px-4 lg:px-6 py-2.5 flex items-center justify-between gap-4">
          {/* Brand & SOC Station */}
          <div className="flex items-center gap-3.5">
            <div className="relative w-9 h-9 bg-[#FF1744]/10 border border-[#FF1744]/30 flex items-center justify-center text-[#FF1744] flex-shrink-0">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#FF1744] siem-radar-ping" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-plex-sans text-sm font-bold tracking-wider text-white">
                  CYBER COFFEE SOC / SIEM
                </span>
                <span className="text-[10px] font-plex-mono px-1.5 py-0.5 bg-[#E5BDDF]/10 text-[#E5BDDF] border border-[#E5BDDF]/30 font-semibold">
                  v2.6 COMMAND
                </span>
                <span className="hidden xl:inline-flex items-center gap-1 text-[10px] font-plex-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/25">
                  <ShieldCheck className="w-3 h-3" />
                  <span>2-LAYER DEFENSE ACTIVE</span>
                </span>
              </div>
              <p className="text-[11px] text-[#64748B] font-plex-mono hidden sm:flex items-center gap-2 mt-0.5">
                <span>{storeName}</span>
                <span>•</span>
                <span className="text-[#8E9EB5]">Live Threat Telemetry Feed</span>
              </p>
            </div>
          </div>

          {/* Right System Readouts & Controls */}
          <div className="flex items-center gap-2.5">
            {/* Clock */}
            <div className="hidden md:flex flex-col items-end px-3 py-1 bg-black/40 border border-white/[0.06] font-plex-mono text-[11px]">
              <div className="text-white font-bold tracking-wider tabular-nums flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block animate-ping" />
                {currentTime || '00:00:00'} VN
              </div>
              <div className="text-[9px] text-[#64748B] tracking-tight">{utcTime || '00:00:00 UTC'}</div>
            </div>

            {/* Node Monitor Sensor */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-plex-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>SENSOR: ACTIVE</span>
            </div>

            {/* SIMULATE ATTACK Tactical Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowAttackMenu((v) => !v)}
                disabled={isPending}
                className="px-3 py-1.5 bg-[#FF1744]/15 hover:bg-[#FF1744]/25 text-[#FF1744] border border-[#FF1744]/35 hover:border-[#FF1744]/60 text-[11px] font-plex-mono font-semibold flex items-center gap-1.5 transition-all shadow-[0_0_16px_rgba(255,23,68,0.15)] active:scale-[0.97] cursor-pointer"
                title="Giả lập kịch bản tấn công an ninh mạng"
              >
                {isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Siren className="w-3.5 h-3.5 animate-bounce" />
                )}
                <span className="hidden sm:inline">SIMULATE ATTACK</span>
                <ChevronDown className="w-3 h-3 text-[#FF1744]" />
              </button>

              {showAttackMenu && (
                <div className="absolute right-0 top-full mt-1.5 w-80 bg-[#12141C] border border-[#FF1744]/40 shadow-[0_12px_40px_rgba(0,0,0,0.9)] z-50 divide-y divide-white/[0.06] backdrop-blur-2xl">
                  <div className="px-3 py-2 bg-[#FF1744]/10 flex items-center justify-between">
                    <span className="text-[10px] font-plex-mono uppercase tracking-wider text-[#FF1744] font-bold flex items-center gap-1.5">
                      <Flame className="w-3 h-3" /> CHOOSE ATTACK SCENARIO
                    </span>
                    <span className="text-[9px] font-plex-mono text-[#8E9EB5]">INJECTOR</span>
                  </div>
                  {SIMULATE_EVENTS.map((e) => (
                    <button
                      key={e.type}
                      onClick={() => handleSimulate(e.type)}
                      className="w-full text-left p-3 text-[11px] font-plex-mono hover:bg-white/[0.04] transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[#F1F5F9] font-bold group-hover:text-[#FF1744] transition-colors">
                          {e.label}
                        </span>
                        <span
                          className={`text-[9px] px-1 py-0.2 border ${
                            e.severity === 'CRITICAL'
                              ? 'text-[#FF1744] border-[#FF1744]/30 bg-[#FF1744]/10'
                              : 'text-[#FFB800] border-[#FFB800]/30 bg-[#FFB800]/10'
                          }`}
                        >
                          {e.severity}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#64748B] line-clamp-2 leading-relaxed">
                        {e.desc}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Staff Dashboard shortcut */}
            <Link
              href="/orders"
              className="px-3 py-1.5 bg-[#FFB800]/10 hover:bg-[#FFB800]/20 text-[#FFB800] border border-[#FFB800]/30 text-[11px] font-plex-mono font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Vào Giao Diện Quán Staff Dashboard"
            >
              <Store className="w-3.5 h-3.5" />
              <span className="hidden md:inline">STAFF DASHBOARD</span>
            </Link>

            {/* Platform Home */}
            <Link
              href="/"
              className="p-1.5 bg-[#161822] border border-white/[0.08] text-[#8E9EB5] hover:text-white hover:border-white/[0.2] transition-colors cursor-pointer"
              title="Về Trang Chủ Khách Hàng"
            >
              <Home className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Integrated Tactical Sub-Nav Tabs Bar */}
        <div className="border-t border-white/[0.06] bg-[#0A0C11]/80">
          <div className="max-w-[1440px] mx-auto px-4 lg:px-6 flex items-center justify-start gap-1 overflow-x-auto">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex items-center gap-2 py-2.5 px-4 font-plex-mono text-[11px] border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                    tab.active
                      ? 'border-[#E5BDDF] text-white font-bold bg-[#E5BDDF]/[0.06]'
                      : 'border-transparent text-[#64748B] hover:text-[#CBD5E1] hover:bg-white/[0.02]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${tab.active ? 'text-[#E5BDDF]' : 'text-[#64748B]'}`} />
                  <span>{tab.label}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 ${
                      tab.active
                        ? 'bg-[#E5BDDF]/20 text-[#E5BDDF] border border-[#E5BDDF]/40'
                        : 'bg-white/[0.04] text-[#64748B]'
                    }`}
                  >
                    {tab.tag}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main SOC Dashboard Body (Maximum Vertical Height) */}
      <main className="max-w-[1440px] mx-auto w-full flex-1 p-4 lg:p-6 pb-12">
        {children}
      </main>
    </div>
  );
}
