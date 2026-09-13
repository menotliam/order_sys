'use client';

import { useState, useEffect, useTransition } from 'react';
import {
  getAllOrdersAction,
  approvePayLaterAction,
  updateOrderStatusAction,
} from '@/actions/order-actions';
import { getStoreConfigAction } from '@/actions/admin-actions';
import { Order, CafeTable } from '@/types/database';
import {
  ClipboardList,
  LayoutGrid,
  Columns,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export default function StaffOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<CafeTable[]>([]);
  const [viewMode, setViewMode] = useState<'kanban' | 'table_map'>('kanban');
  const [isPending, startTransition] = useTransition();

  const loadData = () => {
    startTransition(async () => {
      const [oList, cfg] = await Promise.all([
        getAllOrdersAction(),
        getStoreConfigAction(),
      ]);
      setOrders(oList);
      setTables(cfg.tables);
    });
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleApprovePayLater = async (orderId: string) => {
    await approvePayLaterAction(orderId);
    loadData();
  };

  const handleUpdateStatus = async (
    orderId: string,
    status: Order['status']
  ) => {
    await updateOrderStatusAction(orderId, status);
    loadData();
  };

  const pendingOrders = orders.filter((o) => o.status === 'pending_approval');
  const preparingOrders = orders.filter((o) => o.status === 'paid_preparing');
  const readyOrders = orders.filter((o) => o.status === 'ready');
  const completedOrders = orders.filter((o) => o.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Top Bar Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 border border-[#1E293B] p-4 rounded-2xl">
        <div>
          <h2 className="font-plex-sans text-2xl font-bold text-white flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-amber-400" />
            Điều Hành Đơn Hàng & Sơ Đồ Bàn
          </h2>
          <p className="text-xs text-slate-400 font-plex-sans mt-0.5">
            Xử lý nhanh đơn Trả Sau, báo xong món (Ready) và theo dõi tình trạng
            8 bàn.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('kanban')}
            className={`px-4 py-2 rounded-xl text-xs font-plex-mono flex items-center gap-2 transition-all ${
              viewMode === 'kanban'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Columns className="w-4 h-4" />
            <span>Kanban Món ({orders.length})</span>
          </button>

          <button
            onClick={() => setViewMode('table_map')}
            className={`px-4 py-2 rounded-xl text-xs font-plex-mono flex items-center gap-2 transition-all ${
              viewMode === 'table_map'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Sơ Đồ 8 Bàn</span>
          </button>

          <button
            onClick={loadData}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: KANBAN COLUMNS */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Col 1: Pending Approval */}
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <span className="font-plex-sans font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                Chờ Xác Nhận
              </span>
              <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-plex-mono text-xs font-bold flex items-center justify-center">
                {pendingOrders.length}
              </span>
            </div>

            <div className="space-y-3 flex-1">
              {pendingOrders.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-600 font-plex-mono">
                  Trống
                </div>
              ) : (
                pendingOrders.map((o) => (
                  <div
                    key={o.id}
                    className="p-4 rounded-xl bg-slate-950 border border-amber-500/40 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-plex-sans font-bold text-base text-white">
                        #{o.order_code} • {o.table_number}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-plex-mono text-[10px] uppercase">
                        {o.payment_method === 'pay_later' ? 'Trả Sau' : 'VietQR'}
                      </span>
                    </div>

                    <div className="text-xs font-plex-mono text-cyan-400 font-bold">
                      {o.total_amount.toLocaleString('vi-VN')} VNĐ
                    </div>

                    <div className="space-y-1 pt-2 border-t border-slate-800 text-xs font-plex-sans">
                      {o.items?.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start justify-between gap-2 text-slate-300"
                        >
                          <span>
                            {item.quantity}x {item.product_name}
                          </span>
                          {item.note && (
                            <span className="text-amber-300 text-[11px]">
                              ({item.note})
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {o.payment_method === 'pay_later' && (
                      <button
                        onClick={() => handleApprovePayLater(o.id)}
                        className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-plex-sans text-sm font-bold flex items-center justify-center gap-1 shadow-md transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Duyệt Đơn Trả Sau</span>
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Col 2: Preparing */}
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <span className="font-plex-sans font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                Đang Pha Chế
              </span>
              <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-plex-mono text-xs font-bold flex items-center justify-center">
                {preparingOrders.length}
              </span>
            </div>

            <div className="space-y-3 flex-1">
              {preparingOrders.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-600 font-plex-mono">
                  Trống
                </div>
              ) : (
                preparingOrders.map((o) => (
                  <div
                    key={o.id}
                    className="p-4 rounded-xl bg-slate-950 border border-cyan-500/40 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-plex-sans font-bold text-base text-white">
                        #{o.order_code} • {o.table_number}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-plex-mono text-[10px] uppercase">
                        {o.is_paid ? 'Đã Trả' : 'Chưa Trả'}
                      </span>
                    </div>

                    <div className="space-y-1 pt-2 border-t border-slate-800 text-xs font-plex-sans">
                      {o.items?.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start justify-between gap-2 text-slate-300"
                        >
                          <span>
                            {item.quantity}x {item.product_name}
                          </span>
                          {item.note && (
                            <span className="text-cyan-300 text-[11px]">
                              ({item.note})
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => handleUpdateStatus(o.id, 'ready')}
                      className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-plex-sans text-sm font-bold flex items-center justify-center gap-1 shadow-md transition-all"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Báo Xong Món (Ready)</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Col 3: Ready */}
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <span className="font-plex-sans font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Ready (Sẵn Sàng)
              </span>
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-plex-mono text-xs font-bold flex items-center justify-center">
                {readyOrders.length}
              </span>
            </div>

            <div className="space-y-3 flex-1">
              {readyOrders.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-600 font-plex-mono">
                  Trống
                </div>
              ) : (
                readyOrders.map((o) => (
                  <div
                    key={o.id}
                    className="p-4 rounded-xl bg-slate-950 border border-emerald-500/40 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-plex-sans font-bold text-base text-white">
                        #{o.order_code} • {o.table_number}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-plex-mono text-[10px] uppercase">
                        Sẵn Sàng
                      </span>
                    </div>

                    <div className="space-y-1 pt-2 border-t border-slate-800 text-xs font-plex-sans">
                      {o.items?.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start justify-between gap-2 text-slate-300"
                        >
                          <span>
                            {item.quantity}x {item.product_name}
                          </span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => handleUpdateStatus(o.id, 'completed')}
                      className="w-full py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-plex-sans text-sm font-bold flex items-center justify-center gap-1 shadow-md transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Hoàn Thành Phục Vụ</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Col 4: Completed */}
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 flex flex-col opacity-80">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <span className="font-plex-sans font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-slate-400" />
                Hoàn Thành
              </span>
              <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-400 font-plex-mono text-xs font-bold flex items-center justify-center">
                {completedOrders.length}
              </span>
            </div>

            <div className="space-y-3 flex-1">
              {completedOrders.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-600 font-plex-mono">
                  Trống
                </div>
              ) : (
                completedOrders.map((o) => (
                  <div
                    key={o.id}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-plex-sans font-bold text-slate-300">
                        #{o.order_code} • {o.table_number}
                      </span>
                      <span className="text-xs font-plex-mono text-slate-500">
                        {o.total_amount.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: TABLE MAP (8 BÀN) */}
      {viewMode === 'table_map' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {tables.map((t) => {
            const tableOrders = orders.filter(
              (o) =>
                o.table_id === t.id &&
                o.status !== 'completed' &&
                o.status !== 'cancelled'
            );
            const isOccupied = tableOrders.length > 0;
            const hasPendingPayLater = tableOrders.some(
              (o) => o.payment_method === 'pay_later' && o.status === 'pending_approval'
            );

            return (
              <div
                key={t.id}
                className={`rounded-2xl p-5 border flex flex-col justify-between transition-all ${
                  hasPendingPayLater
                    ? 'bg-amber-500/10 border-amber-500 shadow-lg shadow-amber-500/10'
                    : isOccupied
                      ? 'bg-cyan-500/10 border-cyan-500/60'
                      : 'bg-slate-900/50 border-slate-800/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-plex-sans text-2xl font-bold text-white">
                      {t.table_number}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-plex-mono uppercase tracking-wider ${
                        hasPendingPayLater
                          ? 'bg-amber-500 text-slate-950 font-bold animate-pulse'
                          : isOccupied
                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                            : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {hasPendingPayLater
                        ? 'Chờ Duyệt Pay-Later'
                        : isOccupied
                          ? 'Có Khách'
                          : 'Bàn Trống'}
                    </span>
                  </div>

                  {/* List active orders on this table */}
                  <div className="space-y-2 mt-4">
                    {tableOrders.length === 0 ? (
                      <p className="text-xs text-slate-500 font-plex-mono">
                        Bàn hiện chưa có đơn gọi món nào.
                      </p>
                    ) : (
                      tableOrders.map((o) => (
                        <div
                          key={o.id}
                          className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2"
                        >
                          <div className="flex items-center justify-between text-xs font-plex-mono">
                            <span className="font-bold text-white">
                              #{o.order_code}
                            </span>
                            <span className="text-cyan-400 font-bold">
                              {o.total_amount.toLocaleString('vi-VN')}đ
                            </span>
                          </div>

                          {o.payment_method === 'pay_later' &&
                            o.status === 'pending_approval' && (
                              <button
                                onClick={() => handleApprovePayLater(o.id)}
                                className="w-full py-1.5 px-2 rounded bg-amber-500 text-slate-950 font-plex-sans text-xs font-bold"
                              >
                                Duyệt Pay-Later
                              </button>
                            )}

                          {o.status === 'paid_preparing' && (
                            <button
                              onClick={() => handleUpdateStatus(o.id, 'ready')}
                              className="w-full py-1.5 px-2 rounded bg-cyan-500 text-slate-950 font-plex-sans text-xs font-bold"
                            >
                              Báo Ready
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] font-plex-mono text-slate-500 flex items-center justify-between">
                  <span>TOKEN: {t.qr_token}</span>
                  <span>THE CYBER COFFEE</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
