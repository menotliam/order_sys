'use client';

import { useState, useTransition, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';
import { signInAction } from '@/actions/auth-actions';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') || '/orders';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    if (!email.trim() || !password) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }
    setError(null);

    startTransition(async () => {
      const result = await signInAction(email.trim(), password);
      if (!result.success) {
        setError(result.message ?? 'Đăng nhập thất bại.');
        return;
      }
      router.replace(nextPath);
      router.refresh();
    });
  };

  return (
    <div className="min-h-screen bg-[#0A0F1D] text-[#E2E8F0] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 border border-[#1E293B] bg-[rgba(20,27,45,0.5)] flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-[#00E5FF]" />
          </div>
          <div>
            <h1 className="font-plex-sans text-lg font-bold tracking-wide">
              KHU VỰC QUẢN TRỊ
            </h1>
            <p className="text-[11px] font-plex-mono text-[#64748B]">
              AUTHENTICATION REQUIRED
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="text-[11px] font-plex-mono text-[#64748B] uppercase tracking-wider">
              Email
            </span>
            <div className="mt-1.5 flex items-center gap-2 border border-[#1E293B] bg-[rgba(20,27,45,0.5)] px-3 focus-within:border-[#00E5FF]/40 transition-colors">
              <Mail className="w-4 h-4 text-[#64748B] shrink-0" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                autoComplete="username"
                className="w-full bg-transparent py-3 text-sm font-plex-mono outline-none placeholder:text-[#334155]"
                placeholder="nhanvien@quan.vn"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-[11px] font-plex-mono text-[#64748B] uppercase tracking-wider">
              Mật khẩu
            </span>
            <div className="mt-1.5 flex items-center gap-2 border border-[#1E293B] bg-[rgba(20,27,45,0.5)] px-3 focus-within:border-[#00E5FF]/40 transition-colors">
              <Lock className="w-4 h-4 text-[#64748B] shrink-0" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                autoComplete="current-password"
                className="w-full bg-transparent py-3 text-sm font-plex-mono outline-none placeholder:text-[#334155]"
                placeholder="••••••••"
              />
            </div>
          </label>

          {error && (
            <div className="flex items-start gap-2 border border-[#FF1744]/30 bg-[#FF1744]/5 px-3 py-2.5">
              <AlertCircle className="w-4 h-4 text-[#FF1744] shrink-0 mt-0.5" />
              <p className="text-xs text-[#FF1744] font-plex-sans">{error}</p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="w-full py-3.5 bg-[#00E5FF]/10 border border-[#00E5FF]/40 text-[#00E5FF] font-plex-sans font-bold text-sm tracking-wider hover:bg-[#00E5FF]/20 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                ĐANG XÁC THỰC
              </>
            ) : (
              'ĐĂNG NHẬP'
            )}
          </button>
        </div>

        <p className="mt-6 text-[11px] font-plex-mono text-[#475569] leading-relaxed">
          Mọi lần đăng nhập thất bại đều được ghi vào nhật ký an ninh kèm địa chỉ IP.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0A0F1D]" />}>
      <LoginForm />
    </Suspense>
  );
}
