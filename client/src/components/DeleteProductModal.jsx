import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2 } from 'lucide-react';

export default function DeleteProductModal({
  productToDelete,
  setProductToDelete,
  confirmDeleteProduct
}) {
  return (
    <AnimatePresence>
      {productToDelete && (
        <div id="delete_modal_overlay" className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm relative text-left shadow-2xl space-y-4"
          >
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
              <Trash2 className="w-6 h-6 text-rose-500" />
            </div>

            <div className="space-y-1">
              <h3 className="font-display font-semibold text-lg text-white">
                Delete Catalog Product?
              </h3>
              <p className="text-zinc-400 text-xs font-sans">
                Are you sure you want to permanently delete <strong className="text-zinc-250">"{productToDelete.name}"</strong>? This action will sync with our Express database.
              </p>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                id="delete_cancel_btn"
                onClick={() => setProductToDelete(null)}
                className="flex-1 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 font-semibold py-2 rounded-lg text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="delete_confirm_btn"
                onClick={confirmDeleteProduct}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 rounded-lg text-xs transition-colors shadow cursor-pointer font-display"
              >
                Confirm Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
