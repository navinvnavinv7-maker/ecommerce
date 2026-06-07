import React from 'react';
import { ArrowLeft, ShoppingBag, Minus, Plus, Trash2, ArrowRight, Clock } from 'lucide-react';

const getCategoryEmoji = (category) => {
  const cat = (category || '').toLowerCase();
  if (cat.includes('peripheral')) return '⌨️';
  if (cat.includes('audio')) return '🎧';
  if (cat.includes('accessor')) return '🎒';
  if (cat.includes('furnit')) return '🪑';
  if (cat.includes('monitor')) return '🖥️';
  return '📦';
};

export default function CartView({
  cart,
  updateCartQuantity,
  removeFromCart,
  setActiveTab,
  cartItemCount,
  cartSubtotal,
  shippingCost,
  cartTotal
}) {
  return (
    <div id="cart_view" className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1 text-left">
          <h2 className="text-3xl font-display font-semibold tracking-tight text-white font-display">Your Shopping Cart</h2>
          <p className="text-zinc-400 text-xs font-sans">Review workspace inventory and adjust counts before proceeding.</p>
        </div>
        <button 
          id="back_to_shop_from_cart"
          onClick={() => setActiveTab('shop')}
          className="text-zinc-400 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Continue Shopping</span>
        </button>
      </div>

      {cart.length === 0 ? (
        <div id="empty_cart_banner" className="text-center py-20 bg-zinc-900/30 rounded-2xl border border-zinc-900/60 max-w-md mx-auto">
          <span className="text-6xl block mb-4 filter select-none">🛒</span>
          <h3 className="font-display text-lg font-medium text-zinc-300">Your cart is empty</h3>
          <p className="text-zinc-500 text-sm mt-1">Discover hardware designs in-store and add them to kick off checkout flow.</p>
          <button 
            onClick={() => setActiveTab('shop')}
            className="mt-6 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold rounded-lg transition-colors cursor-pointer font-display"
          >
            Explore Catalog
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* List of Cart Items */}
          <div id="cart_items_list" className="lg:col-span-2 space-y-4">
            {cart.map(item => (
              <div 
                key={item.id}
                id={`cart_item_row_${item.id}`}
                className="bg-zinc-900/50 rounded-xl border border-zinc-900 p-4 flex flex-col sm:flex-row items-center gap-4 justify-between"
              >
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="w-16 h-16 rounded-lg bg-zinc-950 flex items-center justify-center overflow-hidden shrink-0 border border-zinc-805 select-none text-3xl">
                    <span>{getCategoryEmoji(item.category)}</span>
                  </div>
                  <div className="text-left">
                    <span className="text-[9px] uppercase tracking-wider font-mono text-zinc-500">{item.category}</span>
                    <h4 className="text-sm font-medium text-white tracking-tight line-clamp-1">{item.name}</h4>
                    <span className="font-mono text-xs text-amber-500 mt-0.5 block">${item.price.toFixed(2)}</span>
                  </div>
                </div>

                {/* Quantity Controls and Delete */}
                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-t-0 border-zinc-850 pt-3 sm:pt-0">
                  <div className="flex items-center gap-2 border border-zinc-800 bg-zinc-950 p-1 rounded-lg">
                    <button
                      id={`qty_dec_${item.id}`}
                      onClick={() => updateCartQuantity(item.id, -1)}
                      className="p-1 rounded text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center font-mono text-xs font-medium text-zinc-200">
                      {item.quantity}
                    </span>
                    <button
                      id={`qty_inc_${item.id}`}
                      onClick={() => updateCartQuantity(item.id, 1)}
                      className="p-1 rounded text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-mono text-sm font-medium text-zinc-200 min-w-16 text-right">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                    <button
                      id={`remove_cart_${item.id}`}
                      onClick={() => removeFromCart(item.id, item.name)}
                      className="text-zinc-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-zinc-900/50 transition-all cursor-pointer"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>

          {/* Subtotal sidebar */}
          <div id="cart_summary_sidebar" className="bg-zinc-900/40 border border-zinc-900 rounded-xl p-5 space-y-6 self-start">
            <h3 className="font-display font-medium text-base text-zinc-200 tracking-wide pb-3 border-b border-zinc-800">
              Order Inventory Summary
            </h3>
            
            <div className="space-y-3 font-sans text-xs text-left">
              <div className="flex justify-between text-zinc-400">
                <span>Subtotal amount</span>
                <span className="font-mono text-zinc-300">${cartSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Standard Courier Delivery</span>
                <span className="font-mono text-zinc-300">${shippingCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Sales & State Tax</span>
                <span className="font-mono text-zinc-300">Calculated on checkout</span>
              </div>
              
              <div className="pt-4 border-t border-zinc-850 flex justify-between font-medium">
                <span className="text-zinc-200 text-sm">Estimated Total</span>
                <span className="font-mono text-base text-amber-500">${cartTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              id="cart_proceed_to_checkout_btn"
              onClick={() => setActiveTab('checkout')}
              className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold py-2.5 rounded-lg text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer font-display shadow"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-[10px] text-zinc-500 text-center flex items-center justify-center gap-1.5 font-mono">
              <Clock className="w-3.5 h-3.5 text-zinc-650" />
              <span>Orders processed within 24 hours.</span>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
