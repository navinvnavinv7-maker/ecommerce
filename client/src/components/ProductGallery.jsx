import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

/**
 * Product image gallery with carousel + thumbnails.
 * Accepts images as: [{ url, alt, isPrimary }] or [string]
 */
export default function ProductGallery({ images = [], productName = '' }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [direction, setDirection] = useState(1);

  // Normalize image formats
  const normalizedImages = images.map(img =>
    typeof img === 'string'
      ? { url: img, alt: productName, isPrimary: false }
      : img
  );

  if (!normalizedImages.length) {
    // Placeholder gradient block when no images
    return (
      <div className="aspect-video rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-800 flex items-center justify-center">
        <div className="text-center space-y-2">
          <span className="text-5xl">📦</span>
          <p className="text-zinc-500 text-sm font-mono">No Images</p>
        </div>
      </div>
    );
  }

  const current = normalizedImages[currentIdx];

  const prev = () => {
    setDirection(-1);
    setCurrentIdx(i => (i === 0 ? normalizedImages.length - 1 : i - 1));
  };

  const next = () => {
    setDirection(1);
    setCurrentIdx(i => (i === normalizedImages.length - 1 ? 0 : i + 1));
  };

  const isGradient = current.url && current.url.startsWith('from-');

  return (
    <div className="space-y-3">
      {/* Main Image */}
      <div className="relative aspect-video rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 group">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentIdx}
            custom={direction}
            initial={{ opacity: 0, x: direction * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -40 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0"
          >
            {isGradient ? (
              <div className={`w-full h-full bg-gradient-to-br ${current.url} flex items-center justify-center`}>
                <span className="text-6xl select-none">📦</span>
              </div>
            ) : (
              <img
                src={current.url}
                alt={current.alt || productName}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Nav Arrows (only when multiple images) */}
        {normalizedImages.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-zinc-950/80 hover:bg-zinc-900 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm border border-zinc-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-zinc-950/80 hover:bg-zinc-900 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm border border-zinc-800"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Image counter badge */}
        {normalizedImages.length > 1 && (
          <span className="absolute bottom-3 right-3 bg-zinc-950/80 text-zinc-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-zinc-800 backdrop-blur-sm">
            {currentIdx + 1} / {normalizedImages.length}
          </span>
        )}

        {/* Primary badge */}
        {current.isPrimary && (
          <span className="absolute top-3 left-3 bg-amber-500 text-zinc-950 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full">
            Primary
          </span>
        )}
      </div>

      {/* Thumbnails row */}
      {normalizedImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {normalizedImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => { setDirection(idx > currentIdx ? 1 : -1); setCurrentIdx(idx); }}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                idx === currentIdx ? 'border-amber-500' : 'border-zinc-800 hover:border-zinc-600'
              }`}
            >
              {img.url.startsWith('from-') ? (
                <div className={`w-full h-full bg-gradient-to-br ${img.url} flex items-center justify-center text-xl`}>📦</div>
              ) : (
                <img src={img.url} alt={img.alt || productName} className="w-full h-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
