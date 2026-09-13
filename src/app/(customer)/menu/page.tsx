'use client';

import { useState, useEffect, useTransition, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getMenuCatalogAction } from '@/actions/menu-actions';
import { resolveTableAction } from '@/actions/admin-actions';
import { Category, Product, PublicTableInfo, Store } from '@/types/database';
import { CartItem } from '@/types/order';
import { CustomerHeader } from '@/components/customer/customer-header';
import { ItemModal } from '@/components/customer/item-modal';
import { CartSheet } from '@/components/customer/cart-sheet';
import { Search, Plus, Sparkles, Coffee } from 'lucide-react';

function CustomerMenuContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('tableToken') || '';

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [store, setStore] = useState<Store | null>(null);
  const [table, setTable] = useState<PublicTableInfo | null>(null);
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      // resolveTableAction returns only this customer's own table. The
      // previous code fetched every table and matched client-side, which
      // shipped all qr_tokens to every customer's browser.
      const [menuRes, resolved] = await Promise.all([
        getMenuCatalogAction(),
        resolveTableAction(token),
      ]);
      setCategories(menuRes.categories);
      setProducts(menuRes.products);
      setStore(resolved?.store ?? null);
      setTable(resolved?.table ?? null);
    });
  }, [token]);

  const handleAddToCart = (newItem: CartItem) => {
    setCartItems((prev) => {
      const idx = prev.findIndex(
        (i) => i.product_id === newItem.product_id && i.note === newItem.note
      );
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx].quantity += newItem.quantity;
        return copy;
      }
      return [...prev, newItem];
    });
  };

  const handleUpdateQuantity = (idx: number, newQty: number) => {
    setCartItems((prev) => {
      const copy = [...prev];
      if (newQty <= 0) {
        copy.splice(idx, 1);
      } else {
        copy[idx].quantity = newQty;
      }
      return copy;
    });
  };

  const handleRemoveItem = (idx: number) => {
    setCartItems((prev) => {
      const copy = [...prev];
      copy.splice(idx, 1);
      return copy;
    });
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const filteredProducts = products.filter((p) => {
    const matchCat = selectedCat === 'all' || p.category_id === selectedCat;
    const matchQuery =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description &&
        p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchQuery;
  });

  return (
    <div className="min-h-screen bg-[#0A0F1D] text-[#E2E8F0] pb-28">
      {/* Header */}
      <CustomerHeader
        storeName={store?.name || 'The Cyber Coffee'}
        tableNumber={table?.table_number || 'Bàn 01'}
      />

      {/* Hero Banner Mobile */}
      <div className="max-w-md mx-auto px-4 pt-4">
        <div className="relative rounded-2xl bg-gradient-to-r from-cyan-900/40 via-blue-900/40 to-slate-900 border border-[#1E293B] p-5 overflow-hidden">
          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-[#00E5FF] text-[11px] font-plex-mono border border-cyan-500/30 mb-2">
              <Sparkles className="w-3 h-3" />
              THỨC UỐNG ĐẶC SẢN
            </span>
            <h2 className="font-plex-sans text-2xl font-bold text-white leading-tight">
              Thưởng Thức Hương Vị Đỉnh Cao
            </h2>
            <p className="text-xs text-slate-300 font-plex-sans mt-1 max-w-[240px]">
              Đặt món tại bàn không cần chờ đợi. Xem menu và ghi chú độ ngọt
              đá theo ý muốn.
            </p>
          </div>
          <Coffee className="absolute -right-3 -bottom-3 w-28 h-28 text-cyan-500/10 rotate-12" />
        </div>
      </div>

      {/* Search & Category Filter Tabs */}
      <div className="max-w-md mx-auto px-4 mt-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute top-3.5 left-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm món nước (cà phê, trà, đá xay...)"
            className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-colors font-plex-sans"
          />
        </div>

        {/* Category horizontal scroll */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setSelectedCat('all')}
            className={`px-4 py-2 rounded-xl text-xs font-plex-mono whitespace-nowrap transition-all ${
              selectedCat === 'all'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Tất Cả Món
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCat(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-plex-mono whitespace-nowrap transition-all ${
                selectedCat === cat.id
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Product List Grid */}
      <div className="max-w-md mx-auto px-4 mt-4 space-y-3">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 text-slate-500 font-plex-mono text-sm">
            Không tìm thấy món uống phù hợp.
          </div>
        ) : (
          filteredProducts.map((p) => (
            <div
              key={p.id}
              onClick={() => p.is_available && setSelectedProduct(p)}
              className={`group rounded-2xl p-3 flex items-center gap-3.5 transition-all ${
                p.is_available
                  ? 'bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/50 cursor-pointer active:scale-[0.98]'
                  : 'bg-slate-900/30 border border-slate-800/40 opacity-50 cursor-not-allowed'
              }`}
            >
              {/* Photo */}
              <div className="w-20 h-20 rounded-xl bg-slate-800 overflow-hidden shrink-0 relative">
                {p.image_url ? (
                  <img
                    src={p.image_url}
                    alt={p.name}
                    className={`w-full h-full object-cover transition-transform duration-300 ${
                      p.is_available ? 'group-hover:scale-105' : 'grayscale'
                    }`}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-slate-500 font-plex-mono">
                    IMG
                  </div>
                )}
                {!p.is_available && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <span className="text-[10px] font-plex-mono font-bold text-red-400 uppercase bg-red-500/20 px-2 py-0.5 rounded border border-red-500/30">
                      Hết hàng
                    </span>
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <h4 className={`font-plex-sans text-lg font-bold truncate ${p.is_available ? 'text-white' : 'text-slate-500'}`}>
                  {p.name}
                </h4>
                <p className="text-xs text-slate-400 font-plex-sans line-clamp-2 mt-0.5">
                  {p.description}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span className={`font-plex-mono text-base font-bold ${p.is_available ? 'text-cyan-400' : 'text-slate-600 line-through'}`}>
                    {p.price.toLocaleString('vi-VN')}đ
                  </span>
                  {p.is_available ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProduct(p);
                      }}
                      className="px-3 py-1 rounded-lg bg-cyan-500/10 group-hover:bg-cyan-500 text-cyan-400 group-hover:text-slate-950 font-plex-mono text-xs font-bold border border-cyan-500/30 flex items-center gap-1 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm</span>
                    </button>
                  ) : (
                    <span className="px-3 py-1 rounded-lg bg-red-500/10 text-red-400 font-plex-mono text-xs font-bold border border-red-500/20">
                      Hết hàng
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Note & Quantity Item Modal */}
      <ItemModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />

      {/* Floating Cart & Sheet Modal */}
      <CartSheet
        qrToken={token}
        tableNumber={table?.table_number || 'Bàn'}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
      />
    </div>
  );
}

export default function CustomerMenuPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0A0F1D] flex items-center justify-center text-slate-400 font-plex-mono">
          Đang tải thực đơn đồ uống...
        </div>
      }
    >
      <CustomerMenuContent />
    </Suspense>
  );
}
