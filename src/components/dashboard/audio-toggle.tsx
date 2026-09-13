'use client';

import { useState, useEffect } from 'react';
import { Volume2, VolumeX, BellRing } from 'lucide-react';
import { playStaffNewOrderAlert } from '@/lib/audio';
import { getAllOrdersAction } from '@/actions/order-actions';

export function AudioAlertToggle() {
  const [enabled, setEnabled] = useState(true);
  const [lastOrderCount, setLastOrderCount] = useState<number | null>(null);

  // Poll orders every 4 seconds to check if a new order arrived -> ding-dong alert!
  useEffect(() => {
    const checkNewOrders = async () => {
      const orders = await getAllOrdersAction();
      const currentCount = orders.length;

      if (lastOrderCount !== null && currentCount > lastOrderCount) {
        // A new order arrived!
        if (enabled) {
          playStaffNewOrderAlert();
        }
      }
      setLastOrderCount(currentCount);
    };

    checkNewOrders();
    const interval = setInterval(checkNewOrders, 4000);
    return () => clearInterval(interval);
  }, [enabled, lastOrderCount]);

  const handleToggle = () => {
    const nextState = !enabled;
    setEnabled(nextState);
    if (nextState) {
      // Test audio immediately on enable
      playStaffNewOrderAlert();
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={`px-3 py-1.5 rounded-xl border text-xs font-plex-mono flex items-center gap-1.5 transition-all ${
        enabled
          ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-lg shadow-amber-500/10'
          : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-400'
      }`}
      title="Bật/Tắt âm báo khi có đơn mới cho nhân viên"
    >
      {enabled ? (
        <>
          <Volume2 className="w-4 h-4 text-amber-400 animate-pulse" />
          <span className="hidden sm:inline">Âm Báo: BẬT</span>
        </>
      ) : (
        <>
          <VolumeX className="w-4 h-4 text-slate-500" />
          <span className="hidden sm:inline">Âm Báo: TẮT</span>
        </>
      )}
    </button>
  );
}
