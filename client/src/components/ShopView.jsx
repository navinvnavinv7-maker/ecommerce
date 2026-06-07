import React from 'react';
import { Filter, Search, X, Sparkles, Package } from 'lucide-react';
import ProductCard from './ProductCard';

const getCategoryLabel = (cat) => {
  const label = cat.trim();
  switch (label) {
    case 'All': return '🛍️ All';
    case 'Peripherals': return '⌨️ Peripherals';
    case 'Audio': return '🎧 Audio';
    case 'Accessories': return '🎒 Accessories';
    case 'Furniture': return '🪑 Furniture';
    case 'Monitors': return '🖥️ Monitors';
    default: return label;
  }
};

export default function ShopView({
  filteredProducts,
  addToCart,
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  uniqueCategories
}) {
  return (
    <div id="shop_view" className="space-y-8">
      
      {/* Dynamic Intro Banner */}
      <div id="shop_cover_jumbotron" className="relative h-64 rounded-2xl overflow-hidden bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-900 flex items-center pl-8 md:pl-12">
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#27272a_1.5px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="absolute top-1/2 right-12 -translate-y-1/2 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-4 right-12 -translate-y-1/2 w-48 h-48 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none"></div>

        <div className="max-w-xl space-y-4 relative z-10 text-left">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-800 border border-zinc-700/60 text-amber-500">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-[10px] font-mono uppercase tracking-widest font-semibold">Nexus Curated Selection</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-medium tracking-tight text-white leading-none">
            Futuristic Desk & Peripherals Catalog
          </h1>
          <p className="text-zinc-400 text-sm md:text-base leading-relaxed">
            Engineered minimalism for your high-performance workspace. Live-synced to Express REST Endpoints. Add items to see React state-rendering in action.
          </p>
        </div>
      </div>

      {/* Filter Search/Category Sidebar Row */}
      <div id="filter_control_bar" className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center bg-zinc-900/50 p-4 rounded-xl border border-zinc-900/85">
        
        {/* Category selector pills */}
        <div id="category_pills" className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs text-zinc-500 font-mono uppercase mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            Filter:
          </span>
          {uniqueCategories.map(cat => (
            <button
              key={cat}
              id={`cat_pill_${cat.toLowerCase()}`}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${selectedCategory === cat ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-750 hover:text-zinc-200'}`}
            >
              {getCategoryLabel(cat)}
            </button>
          ))}
        </div>

        {/* Live search input field */}
        <div id="search_input_ct" className="relative w-full lg:max-w-xs">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="catalog_search_field"
            type="text"
            placeholder="Query names or categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-4 py-1.5 w-full text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/30 transition-all font-sans"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')} 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

      </div>

      {/* Products grid */}
      <div id="products_grid_section">
        {filteredProducts.length === 0 ? (
          <div id="blank_products_box" className="text-center py-20 bg-zinc-900/30 rounded-2xl border border-zinc-900/60">
            <span className="text-5xl block mb-4 filter select-none">📦</span>
            <h3 className="font-display text-lg font-medium text-zinc-300">No products found</h3>
            <p className="text-zinc-500 text-sm mt-1 max-w-sm mx-auto">Try refining your filter parameters or checking correct character capitalization.</p>
            <button 
              onClick={() => { setSelectedCategory('All'); setSearchTerm(''); }}
              className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-750 text-xs rounded-lg font-medium text-zinc-300 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map(product => (
              <ProductCard 
                key={product.id}
                product={product}
                addToCart={addToCart}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
