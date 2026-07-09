import React, { useState } from 'react';
import { Filter, Search, X, Sparkles, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
import ProductCard from './ProductCard';

const SORT_OPTIONS = [
  { value: '', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'name_asc', label: 'Name: A → Z' },
  { value: 'name_desc', label: 'Name: Z → A' }
];

const getCategoryLabel = (cat) => {
  if (!cat || cat === 'All') return '🛍️ All';
  const name = cat.name || cat;
  const lc = name.toLowerCase();
  if (lc.includes('peripheral')) return `⌨️ ${name}`;
  if (lc.includes('audio')) return `🎧 ${name}`;
  if (lc.includes('accessor')) return `🎒 ${name}`;
  if (lc.includes('furnit')) return `🪑 ${name}`;
  if (lc.includes('monitor')) return `🖥️ ${name}`;
  return name;
};

export default function ShopView({
  products,
  addToCart,
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  categories,
  // Pagination & sorting (driven from App.jsx state)
  currentPage,
  totalPages,
  totalProducts,
  onPageChange,
  sortBy,
  onSortChange,
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
  loading
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Derive unique category list (supports both old string array and new object array)
  const allCategories = [{ _id: 'all', name: 'All', slug: 'all' }, ...categories];

  const selectedId = selectedCategory?._id || selectedCategory || 'all';

  return (
    <div id="shop_view" className="space-y-8">

      {/* Hero Banner */}
      <div id="shop_cover_jumbotron" className="relative h-64 rounded-2xl overflow-hidden bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-900 flex items-center pl-8 md:pl-12">
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#27272a_1.5px,transparent_1px)] [background-size:16px_16px]" />
        <div className="absolute top-1/2 right-12 -translate-y-1/2 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-4 right-12 -translate-y-1/2 w-48 h-48 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

        <div className="max-w-xl space-y-4 relative z-10 text-left">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-800 border border-zinc-700/60 text-amber-500">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-[10px] font-mono uppercase tracking-widest font-semibold">Nexus Curated Selection</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-medium tracking-tight text-white leading-none">
            Futuristic Desk &amp; Peripherals Catalog
          </h1>
          <p className="text-zinc-400 text-sm md:text-base leading-relaxed">
            Engineered minimalism for your high-performance workspace.
            {totalProducts !== undefined && (
              <span className="text-zinc-500 ml-2 font-mono text-xs">{totalProducts} products available</span>
            )}
          </p>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div id="filter_control_bar" className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-900/85 space-y-3">
        {/* Top row: Search + Sort + Filter Toggle */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div id="search_input_ct" className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="catalog_search_field"
              type="text"
              placeholder="Search products, brands, SKUs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-8 py-1.5 w-full text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/30 transition-all font-sans"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex gap-2 items-center">
            {/* Sort dropdown */}
            <select
              id="catalog_sort_select"
              value={sortBy || ''}
              onChange={(e) => onSortChange(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-amber-500/70 font-mono cursor-pointer"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            {/* Filter toggle */}
            <button
              id="filter_toggle_btn"
              onClick={() => setFiltersOpen(o => !o)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${filtersOpen ? 'bg-amber-500 text-zinc-950 border-amber-400' : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'}`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filters
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div id="category_pills" className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs text-zinc-500 font-mono uppercase mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Category:
          </span>
          {allCategories.map(cat => {
            const id = cat._id || cat;
            const isSelected = selectedId === id || (id === 'all' && (!selectedCategory || selectedCategory === 'All'));
            return (
              <button
                key={id}
                id={`cat_pill_${(cat.slug || cat).replace(/\s+/g, '_')}`}
                onClick={() => setSelectedCategory(id === 'all' ? null : cat)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${isSelected ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-750 hover:text-zinc-200'}`}
              >
                {getCategoryLabel(cat)}
              </button>
            );
          })}
        </div>

        {/* Advanced Filters (price range) */}
        {filtersOpen && (
          <div className="flex flex-wrap gap-4 items-center pt-2 border-t border-zinc-800/50">
            <div className="flex items-center gap-2">
              <label className="text-xs text-zinc-500 font-mono uppercase tracking-wider whitespace-nowrap">Min ₹</label>
              <input
                id="filter_min_price"
                type="number"
                min="0"
                value={minPrice || ''}
                onChange={(e) => onMinPriceChange(e.target.value)}
                placeholder="0"
                className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 w-24 focus:outline-none focus:border-amber-500/70 font-mono"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-zinc-500 font-mono uppercase tracking-wider whitespace-nowrap">Max ₹</label>
              <input
                id="filter_max_price"
                type="number"
                min="0"
                value={maxPrice || ''}
                onChange={(e) => onMaxPriceChange(e.target.value)}
                placeholder="Any"
                className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 w-24 focus:outline-none focus:border-amber-500/70 font-mono"
              />
            </div>
            <button
              onClick={() => { onMinPriceChange(''); onMaxPriceChange(''); setSearchTerm(''); setSelectedCategory(null); onSortChange(''); }}
              className="text-xs text-zinc-500 hover:text-white transition-colors font-medium underline underline-offset-2"
            >
              Reset all filters
            </button>
          </div>
        )}
      </div>

      {/* Products Grid */}
      <div id="products_grid_section">
        {loading ? (
          <div className="text-center py-20 space-y-3">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-zinc-500 text-sm font-mono">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div id="blank_products_box" className="text-center py-20 bg-zinc-900/30 rounded-2xl border border-zinc-900/60">
            <span className="text-5xl block mb-4 filter select-none">📦</span>
            <h3 className="font-display text-lg font-medium text-zinc-300">No products found</h3>
            <p className="text-zinc-500 text-sm mt-1 max-w-sm mx-auto">Try refining your filter parameters.</p>
            <button
              onClick={() => { setSelectedCategory(null); setSearchTerm(''); onSortChange(''); onMinPriceChange(''); onMaxPriceChange(''); }}
              className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-750 text-xs rounded-lg font-medium text-zinc-300 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(product => (
              <ProductCard
                key={product.id || product._id}
                product={product}
                addToCart={addToCart}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div id="products_pagination" className="flex items-center justify-center gap-2 pt-4">
          <button
            id="pagination_prev"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
            // Show first, last, and pages near currentPage
            let page;
            if (totalPages <= 7) {
              page = i + 1;
            } else if (i === 0) {
              page = 1;
            } else if (i === 6) {
              page = totalPages;
            } else {
              page = Math.max(2, Math.min(totalPages - 1, currentPage - 2 + i));
            }
            return (
              <button
                key={page}
                id={`pagination_page_${page}`}
                onClick={() => onPageChange(page)}
                className={`w-8 h-8 rounded-lg text-xs font-mono font-semibold transition-all ${
                  currentPage === page
                    ? 'bg-amber-500 text-zinc-950'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                }`}
              >
                {page}
              </button>
            );
          })}

          <button
            id="pagination_next"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <span className="text-xs text-zinc-600 font-mono ml-2">
            Page {currentPage} of {totalPages} • {totalProducts} total
          </span>
        </div>
      )}
    </div>
  );
}
