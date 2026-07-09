import React from 'react';
import { motion } from 'motion/react';
import { ShoppingCart, Tag } from 'lucide-react';
import Rating from './Rating';

const getCategoryEmoji = (category) => {
  const cat = (category?.name || category || '').toLowerCase();
  if (cat.includes('peripheral')) return '⌨️';
  if (cat.includes('audio')) return '🎧';
  if (cat.includes('accessor')) return '🎒';
  if (cat.includes('furnit')) return '🪑';
  if (cat.includes('monitor')) return '🖥️';
  return '📦';
};

const getCategoryName = (category) => {
  if (!category) return '';
  return category.name || category;
};

const isGradient = (val) => val && typeof val === 'string' && val.startsWith('from-');

export default function ProductCard({ product, addToCart }) {
  const mainImage = product.images?.find(i => i.isPrimary)?.url
    || product.images?.[0]?.url
    || product.image;

  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const stockLevel = product.stock ?? null;
  const outOfStock = stockLevel !== null && stockLevel === 0;
  const lowStock = stockLevel !== null && stockLevel > 0 && stockLevel <= 5;

  const categoryName = getCategoryName(product.category);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      key={product.id}
      id={`product_card_${product.id}`}
      className={`group bg-zinc-900/40 rounded-2xl border overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-[0_12px_24px_-10px_rgba(0,0,0,0.6)] ${outOfStock ? 'border-zinc-900/60 opacity-70' : 'border-zinc-900/80 hover:border-zinc-700'}`}
    >
      <div className="flex-1 select-none">
        {/* Image Area */}
        <div className="relative aspect-video overflow-hidden bg-zinc-950 flex items-center justify-center">
          {isGradient(mainImage) ? (
            <>
              <div className={`absolute inset-0 bg-gradient-to-br ${mainImage} opacity-80 group-hover:scale-105 transition-transform duration-500`} />
              <span className="text-6xl drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)] select-none transition-transform duration-500 group-hover:scale-110 relative z-10">
                {getCategoryEmoji(product.category)}
              </span>
            </>
          ) : (
            <img
              src={mainImage}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling?.classList.remove('hidden'); }}
            />
          )}

          {/* Badges row */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {hasDiscount && (
              <span className="bg-red-500 text-white text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full shadow flex items-center gap-1">
                <Tag className="w-2.5 h-2.5" />
                {product.discountPercentage || Math.round(((product.price - product.discountPrice) / product.price) * 100)}% OFF
              </span>
            )}
            {product.featured && (
              <span className="bg-amber-500 text-zinc-950 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full shadow">
                ⭐ Featured
              </span>
            )}
            {product.bestSeller && (
              <span className="bg-orange-500 text-white text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full shadow">
                🔥 Best Seller
              </span>
            )}
          </div>

          {/* Stock badge */}
          {(outOfStock || lowStock) && (
            <span className={`absolute top-2 right-2 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full shadow ${outOfStock ? 'bg-red-950 text-red-400 border border-red-900' : 'bg-amber-950 text-amber-400 border border-amber-900'}`}>
              {outOfStock ? 'Out of Stock' : `${stockLevel} Left`}
            </span>
          )}

          {/* Category badge (bottom right) */}
          {categoryName && (
            <span className="absolute bottom-2 right-2 font-display uppercase tracking-widest text-[9px] font-bold py-1 px-2 rounded bg-zinc-950/90 border border-zinc-800/80 text-zinc-400 shadow">
              {categoryName}
            </span>
          )}
        </div>

        {/* Card body */}
        <div className="p-4">
          {/* Brand + Rating row */}
          <div className="flex items-center justify-between gap-2 mb-2">
            {product.brand ? (
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">{product.brand}</span>
            ) : (
              <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider">ID: {product.id}</span>
            )}
            <Rating value={product.rating || 5.0} count={product.reviewsCount || 0} size="sm" />
          </div>

          <h3 className="font-display font-medium text-base text-white group-hover:text-amber-400 transition-colors tracking-tight line-clamp-1">
            {product.name}
          </h3>

          {product.sku && (
            <p className="text-[9px] font-mono text-zinc-600 mt-0.5">SKU: {product.sku}</p>
          )}

          <p className="text-zinc-400 text-xs mt-2 line-clamp-2 leading-relaxed font-sans">
            {product.description || "High-performance product with premium build quality."}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 pb-4 pt-2 border-t border-zinc-900/40 flex items-center justify-between">
        <div className="flex flex-col text-left">
          {hasDiscount ? (
            <>
              <span className="text-[10px] text-zinc-500 line-through font-mono leading-none">₹{Number(product.price).toLocaleString('en-IN')}</span>
              <span className="text-xl font-semibold text-amber-400 mt-0.5 font-mono">₹{Number(product.discountPrice).toLocaleString('en-IN')}</span>
            </>
          ) : (
            <>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono leading-none">PRICE</span>
              <span className="text-xl font-semibold text-white mt-1 font-mono">₹{Number(product.price).toLocaleString('en-IN')}</span>
            </>
          )}
        </div>

        <button
          id={`add_to_cart_btn_${product.id}`}
          onClick={() => !outOfStock && addToCart(product)}
          disabled={outOfStock}
          className={`text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-all active:scale-95 shadow cursor-pointer font-display ${outOfStock ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-400 text-zinc-950'}`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>{outOfStock ? 'Sold Out' : 'Add to Cart'}</span>
        </button>
      </div>
    </motion.div>
  );
}
