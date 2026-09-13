'use client';

import { useState } from 'react';
import { Product } from '@/types/database';
import { CartItem } from '@/types/order';
import { X, Minus, Plus, MessageSquarePlus, ShoppingBag } from 'lucide-react';

interface ItemModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
}

export function ItemModal({ product, onClose, onAddToCart }: ItemModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');

  if (!product) return null;

  const totalPrice = product.price * quantity;

  const handleAdd = () => {
    onAddToCart({
      product_id: product.id,
      product_name: product.name,
      price: product.price,
      image_url: product.image_url,
      quantity,
      note: note.trim(),
    });
    setQuantity(1);
    setNote('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in-0">
      <div className="w-full max-w-md bg-slate-900 border-t sm:border border-slate-800 rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header Photo */}
        <div className="relative h-56 w-full bg-slate-800">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500 font-plex-mono">
              NO IMAGE
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-slate-950/70 text-slate-300 hover:text-white border border-slate-700 backdrop-blur-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          <div>
            <h3 className="font-plex-sans text-2xl font-bold text-white">
              {product.name}
            </h3>
            <p className="text-sm text-slate-400 mt-1 font-plex-sans">
              {product.description || 'Thức uống đặc biệt từ quán cafe.'}
            </p>
            <div className="mt-3 font-plex-mono text-cyan-400 text-lg font-bold">
              {product.price.toLocaleString('vi-VN')} VNĐ
            </div>
          </div>

          {/* Ghi chú - Custom Note Field */}
          <div className="pt-3 border-t border-slate-800">
            <label className="text-xs font-plex-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
              <MessageSquarePlus className="w-4 h-4 text-cyan-400" />
              Ghi chú tùy chọn (Đường, Đá, Yêu cầu khác...)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ví dụ: Ít đường, nhiều đá, đường 50%..."
              rows={2}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-slate-200 text-sm p-3 placeholder-slate-600 outline-none transition-colors font-plex-sans"
            />
          </div>

          {/* Quantity selector */}
          <div className="pt-2 flex items-center justify-between">
            <span className="text-sm font-plex-mono text-slate-300">Số lượng:</span>
            <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl p-1">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-9 h-9 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center font-plex-mono text-base font-bold text-white">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-9 h-9 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer Action */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-3">
          <button
            onClick={handleAdd}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-plex-sans text-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all"
          >
            <ShoppingBag className="w-5 h-5" />
            <span>Thêm Vào Giỏ — {totalPrice.toLocaleString('vi-VN')}đ</span>
          </button>
        </div>
      </div>
    </div>
  );
}
