import React from 'react';
import { motion } from 'motion/react';
import { ShoppingCart } from 'lucide-react';

const getCategoryEmoji = (category) => {
  const cat = (category || '').toLowerCase();
  if (cat.includes('peripheral')) return '⌨️';
  if (cat.includes('audio')) return '🎧';
  if (cat.includes('accessor')) return '🎒';
  if (cat.includes('furnit')) return '🪑';
  if (cat.includes('monitor')) return '🖥️';
  return '📦';
};

export default function ProductCard({ product, addToCart }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      key={product.id}
      id={`product_card_${product.id}`}
      className="group bg-zinc-900/40 rounded-2xl border border-zinc-900/80 hover:border-zinc-800 overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-[0_12px_24px_-10px_rgba(0,0,0,0.6)]"
    >
      <div className="p-5 flex-1 select-none">
        
        {/* Gradient Thumbnail Placeholder replaced with large centered emoji */}
        <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-950 border border-zinc-850 flex items-center justify-center mb-5 shadow-inner">
          <div className="absolute inset-0 bg-zinc-900/60 opacity-75 group-hover:scale-105 transition-transform duration-500"></div>
          
          <div className="absolute inset-0 bg-radial-gradient(ellipse_at_center,transparent_20%,#09090b_90%) opacity-60"></div>
          
          {/* Centered Large Category Emoji */}
          <span className="text-6xl drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)] transform select-none transition-transform duration-500 group-hover:scale-115 relative z-10">
            {getCategoryEmoji(product.category)}
          </span>

          <span className="absolute bottom-2 right-2 font-display uppercase tracking-widest text-[9px] font-bold py-1 px-2 rounded bg-zinc-950/90 border border-zinc-800/80 text-zinc-400 relative z-10 shadow">
            {product.category}
          </span>
        </div>

        {/* Card metadata (Rating / Title) */}
        <div className="flex items-center justify-between gap-2 mb-2 text-xs">
          <span className="font-mono text-zinc-500 uppercase tracking-widest text-[10px]">ID: {product.id}</span>
          <div className="flex items-center gap-1 text-amber-400 font-mono">
            <span>★</span>
            <span className="font-semibold text-zinc-300">{product.rating}</span>
            <span className="text-zinc-650">({product.reviewsCount})</span>
          </div>
        </div>

        <h3 className="font-display font-medium text-lg text-white group-hover:text-amber-400 transition-colors tracking-tight line-clamp-1">
          {product.name}
        </h3>
        
        <p className="text-zinc-400 text-xs mt-2 line-clamp-2 leading-relaxed font-sans">
          {product.description || "High efficiency design hardware built to integrate aesthetic neatness with extreme tactical typing controls."}
        </p>

      </div>

      {/* Footer containing Pricing and Add To Cart */}
      <div className="px-5 pb-5 pt-2 border-t border-zinc-900/40 flex items-center justify-between">
        <div className="flex flex-col text-left">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono leading-none">PRICING</span>
          <span className="text-xl font-semibold text-white mt-1 font-mono">${product.price.toFixed(2)}</span>
        </div>
        
        <button
          id={`add_to_cart_btn_${product.id}`}
          onClick={() => addToCart(product)}
          className="bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-all active:scale-95 shadow cursor-pointer font-display"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Add to Cart</span>
        </button>
      </div>
    </motion.div>
  );
}
