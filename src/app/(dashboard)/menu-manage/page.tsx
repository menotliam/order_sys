'use client';

import { useState, useEffect, useTransition } from 'react';
import {
  getMenuCatalogAction,
  toggleProductAvailabilityAction,
} from '@/actions/menu-actions';
import { Product, Category } from '@/types/database';
import { Utensils, Search, Check, X, RefreshCw } from 'lucide-react';

export default function StaffMenuManagePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  const loadData = () => {
    startTransition(async () => {
      const res = await getMenuCatalogAction();
      setProducts(res.products);
      setCategories(res.categories);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleAvailability = async (
    productId: string,
    currentAvail: boolean
  ) => {
    await toggleProductAvailabilityAction(productId, !currentAvail);
    loadData();
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description &&
        p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 border border-[#1E293B] p-4 rounded-2xl">
        <div>
          <h2 className="font-plex-sans text-2xl font-bold text-white flex items-center gap-2">
            <Utensils className="w-6 h-6 text-cyan-400" />
            Quản Lý Thực Đơn Nhanh (1 Trạm Chạm)
          </h2>
          <p className="text-xs text-slate-400 font-plex-sans mt-0.5">
            Bật/Tắt trạng thái Còn hàng — Hết hàng realtime trên ứng dụng
            khách hàng.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute top-3.5 left-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm món trong thực đơn..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 outline-none font-plex-sans"
          />
        </div>
      </div>

      {/* Grid of Products with Touch Toggle */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((p) => {
          const cat = categories.find((c) => c.id === p.category_id);

          return (
            <div
              key={p.id}
              className={`rounded-2xl p-4 border flex flex-col justify-between transition-all ${
                p.is_available
                  ? 'bg-slate-900/60 border-slate-800'
                  : 'bg-slate-950/40 border-red-500/40 opacity-75'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-plex-mono uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
                    {cat?.name || 'Đồ uống'}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-plex-mono uppercase ${
                      p.is_available
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-red-500/10 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {p.is_available ? 'CÒN HÀNG' : 'HẾT HÀNG'}
                  </span>
                </div>

                <h3 className="font-plex-sans text-lg font-bold text-white mt-2">
                  {p.name}
                </h3>
                <p className="text-xs text-slate-400 font-plex-sans line-clamp-2 mt-1">
                  {p.description}
                </p>
                <div className="mt-2 font-plex-mono text-cyan-400 font-bold">
                  {p.price.toLocaleString('vi-VN')} VNĐ
                </div>
              </div>

              {/* Touch Toggle Button */}
              <div className="mt-4 pt-3 border-t border-slate-800">
                <button
                  onClick={() =>
                    handleToggleAvailability(p.id, p.is_available)
                  }
                  className={`w-full py-3 px-4 rounded-xl font-plex-sans text-base font-bold flex items-center justify-center gap-2 transition-all ${
                    p.is_available
                      ? 'bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 border border-slate-700'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                  }`}
                >
                  {p.is_available ? (
                    <>
                      <X className="w-4 h-4" />
                      <span>ĐÁNH DẤU HẾT HÀNG</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>BẬT CÒN HÀNG LẠI</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
