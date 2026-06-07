import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

export default function ProductModal({
  showProductModal,
  setShowProductModal,
  isEditing,
  productForm,
  setProductForm,
  handleEditProduct,
  handleAddProduct,
  gradientOptions
}) {
  return (
    <AnimatePresence>
      {showProductModal && (
        <div id="product_modal_overlay" className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md relative text-left shadow-2xl space-y-4"
          >
            <button 
              type="button"
              onClick={() => setShowProductModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="font-display font-semibold text-lg text-white">
                {isEditing ? `Edit hardware attributes` : `Create new design hardware`}
              </h3>
              <p className="text-zinc-500 text-xs font-sans">Maintain specifications matching global store lists.</p>
            </div>

            <form onSubmit={isEditing ? handleEditProduct : handleAddProduct} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono tracking-wider font-semibold text-zinc-400">Hardware Label Name *</label>
                <input
                  id="modal_name_field"
                  type="text"
                  required
                  placeholder="e.g. Apex Pro Premium Keyboard"
                  value={productForm.name}
                  onChange={(e) => setProductForm(p => ({ ...p, name: e.target.value }))}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 w-full text-xs text-zinc-200 focus:outline-none focus:border-amber-500 h-9"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono tracking-wider font-semibold text-zinc-400">Retail price ($) *</label>
                  <input
                    id="modal_price_field"
                    type="number"
                    step="0.01"
                    required
                    placeholder="189.99"
                    value={productForm.price}
                    onChange={(e) => setProductForm(p => ({ ...p, price: e.target.value }))}
                    className="bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 w-full text-xs text-zinc-200 focus:outline-none focus:border-amber-500 h-9"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono tracking-wider font-semibold text-zinc-400">Category Tag</label>
                  <select
                    id="modal_category_field"
                    value={productForm.category}
                    onChange={(e) => setProductForm(p => ({ ...p, category: e.target.value }))}
                    className="bg-zinc-950 border border-zinc-800 rounded-lg p-2 w-full text-xs text-zinc-200 focus:outline-none focus:border-amber-500 h-9"
                  >
                    <option value="Peripherals">Peripherals</option>
                    <option value="Audio">Audio</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Monitors">Monitors</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono tracking-wider font-semibold text-zinc-400">Image Glow Gradient</label>
                <select
                  id="modal_gradient_field"
                  value={productForm.image}
                  onChange={(e) => setProductForm(p => ({ ...p, image: e.target.value }))}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg p-2 w-full text-xs text-zinc-200 focus:outline-none focus:border-amber-500 h-9"
                >
                  {gradientOptions.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono tracking-wider font-semibold text-zinc-400">Description Summary</label>
                <textarea
                  id="modal_desc_field"
                  rows="3"
                  value={productForm.description}
                  placeholder="Provide highlights of keys, switches, performance profiles..."
                  onChange={(e) => setProductForm(p => ({ ...p, description: e.target.value }))}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg p-2 w-full text-xs text-zinc-200 focus:outline-none focus:border-amber-500 font-sans"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  id="modal_cancel_btn"
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 font-semibold py-2 rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="modal_submit_btn"
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-lg text-xs transition-colors shadow cursor-pointer font-display"
                >
                  {isEditing ? `Save Changes` : `Create SKU`}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
