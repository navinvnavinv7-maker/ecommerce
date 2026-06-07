import React from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, CheckCircle, Check } from 'lucide-react';

export default function CheckoutView({
  cart,
  placedOrder,
  setPlacedOrder,
  shippingForm,
  setShippingForm,
  handlePlaceOrder,
  cartItemCount,
  cartSubtotal,
  shippingCost,
  cartTotal,
  userRole,
  setAdminSubTab,
  setActiveTab
}) {
  return (
    <div id="checkout_view" className="space-y-8 animate-fade-in text-left">
      
      <div className="space-y-1">
        <h2 className="text-3xl font-display font-semibold tracking-tight text-white mb-2 font-display">Workspace Purchase Checkout</h2>
        <p className="text-zinc-400 text-xs font-sans">Authorize order logistics and delivery destinations below.</p>
      </div>

      {cart.length === 0 && !placedOrder ? (
        <div id="checkout_empty_alert" className="text-center py-20 bg-zinc-900/30 rounded-2xl border border-zinc-900/60 max-w-sm mx-auto">
          <ShoppingBag className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <h3 className="font-display text-sm font-medium text-zinc-300">Nothing to checkout</h3>
          <p className="text-zinc-500 text-xs mt-1">Please select hardware and populate your cart before initiating checkout.</p>
          <button 
            onClick={() => setActiveTab('shop')}
            className="mt-4 px-4 py-1.5 bg-amber-500 text-zinc-950 text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            Return to Storefront
          </button>
        </div>
      ) : placedOrder ? (
        /* ORDER PLACED SUCCESS PANEL */
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          id="order_success_panel" 
          className="bg-zinc-900/40 border-2 border-dashed border-amber-500/20 rounded-2xl p-8 max-w-md mx-auto text-center space-y-6"
        >
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-amber-500" />
          </div>
          
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-mono tracking-widest text-amber-500">MERN Checkout Success</span>
            <h3 className="font-display text-2xl font-bold text-white tracking-tight font-display font-bold">Order Placed Successfully!</h3>
            <p className="text-zinc-400 text-xs leading-relaxed max-w-xs mx-auto font-sans">
              Your request was synchronized with the Node/Express backend state registry in-memory.
            </p>
          </div>

          <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-4 text-left space-y-2.5 font-mono text-xs text-zinc-400">
            <div className="flex justify-between">
              <span>Order Serial:</span>
              <strong className="text-zinc-200">{placedOrder.id}</strong>
            </div>
            <div className="flex justify-between">
              <span>Recipient name:</span>
              <strong className="text-zinc-200">{placedOrder.customer}</strong>
            </div>
            <div className="flex justify-between">
              <span>Contact channel:</span>
              <strong className="text-zinc-200">{placedOrder.email}</strong>
            </div>
            <div className="flex justify-between">
              <span>Total Charged:</span>
              <strong className="text-amber-500 font-bold">${placedOrder.total.toFixed(2)}</strong>
            </div>
            <div className="flex justify-between">
              <span>Logistics status:</span>
              <strong className="px-1.5 py-0.5 rounded bg-zinc-850 text-zinc-300 text-[10px] uppercase font-sans border border-zinc-750">
                {placedOrder.status}
              </strong>
            </div>
          </div>

          <div className="pt-2 text-zinc-500 text-[10px] font-mono leading-relaxed">
            💡 Switching your system role to <strong>"Merchant"</strong> (in top global bar) allows you to process this order live inside the Admin Panel!
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => { setPlacedOrder(null); setActiveTab('shop'); }}
              className="flex-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-2 rounded-lg text-xs transition-colors cursor-pointer"
            >
              Keep Shopping
            </button>
            {userRole === 'admin' && (
              <button
                onClick={() => { setPlacedOrder(null); setAdminSubTab('orders'); setActiveTab('admin'); }}
                className="flex-1 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 font-semibold py-2 rounded-lg text-xs transition-colors border border-zinc-750 cursor-pointer"
              >
                Track in Admin Panel
              </button>
            )}
          </div>
        </motion.div>
      ) : (
        /* LOGISTIC INPUT FORM */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Shipping address form */}
          <form 
            id="checkout_shipping_form"
            onSubmit={handlePlaceOrder}
            className="lg:col-span-2 bg-zinc-900/40 border border-zinc-900 p-6 rounded-2xl space-y-6"
          >
            <h3 className="font-display font-medium text-lg text-zinc-200 pb-3 border-b border-zinc-850">
              Recipient Shipping & Contact Logistics
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1 text-left">
                <label className="text-[11px] uppercase font-mono tracking-wider font-semibold text-zinc-400">FullName Address *</label>
                <input
                  id="ship_fullName"
                  type="text"
                  required
                  placeholder="e.g. Alex Rivera"
                  value={shippingForm.fullName}
                  onChange={(e) => setShippingForm(p => ({ ...p, fullName: e.target.value }))}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg p-2/5 w-full text-xs text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-amber-500 h-9"
                />
              </div>
              <div className="space-y-1 text-left">
                <label className="text-[11px] uppercase font-mono tracking-wider font-semibold text-zinc-400">Email Contact *</label>
                <input
                  id="ship_email"
                  type="email"
                  required
                  placeholder="alex.rivera@example.com"
                  value={shippingForm.email}
                  onChange={(e) => setShippingForm(p => ({ ...p, email: e.target.value }))}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg p-2/5 w-full text-xs text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-amber-500 h-9"
                />
              </div>
              
              <div className="sm:col-span-2 space-y-1 text-left">
                <label className="text-[11px] uppercase font-mono tracking-wider font-semibold text-zinc-400">Street Address *</label>
                <input
                  id="ship_street"
                  type="text"
                  required
                  placeholder="702 Broad St, Suite 4B"
                  value={shippingForm.street}
                  onChange={(e) => setShippingForm(p => ({ ...p, street: e.target.value }))}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg p-2/5 w-full text-xs text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-amber-500 h-9"
                />
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[11px] uppercase font-mono tracking-wider font-semibold text-zinc-400">City *</label>
                <input
                  id="ship_city"
                  type="text"
                  required
                  placeholder="Austin"
                  value={shippingForm.city}
                  onChange={(e) => setShippingForm(p => ({ ...p, city: e.target.value }))}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg p-2/5 w-full text-xs text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-amber-500 h-9"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1 text-left">
                  <label className="text-[11px] uppercase font-mono tracking-wider font-semibold text-zinc-400">State *</label>
                  <input
                    id="ship_state"
                    type="text"
                    required
                    placeholder="TX"
                    value={shippingForm.state}
                    onChange={(e) => setShippingForm(p => ({ ...p, state: e.target.value }))}
                    className="bg-zinc-950 border border-zinc-800 rounded-lg p-2/5 w-full text-xs text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-amber-500 h-9"
                  />
                </div>
                <div className="space-y-1 text-left">
                  <label className="text-[11px] uppercase font-mono tracking-wider font-semibold text-zinc-400">ZIP Code *</label>
                  <input
                    id="ship_zipCode"
                    type="text"
                    required
                    placeholder="78701"
                    value={shippingForm.zipCode}
                    onChange={(e) => setShippingForm(p => ({ ...p, zipCode: e.target.value }))}
                    className="bg-zinc-950 border border-zinc-800 rounded-lg p-2/5 w-full text-xs text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-amber-500 h-9"
                  />
                </div>
              </div>
            </div>

            {/* Payment selection mock layout */}
            <div className="space-y-3 pt-4 border-t border-zinc-850">
              <label className="text-[11px] uppercase font-mono tracking-wider font-semibold text-zinc-400 block text-left">Secure Payment Gateway Selector</label>
              <div className="grid grid-cols-3 gap-3">
                <div className="border border-amber-500/40 bg-amber-500/5 p-3 rounded-xl flex flex-col items-center justify-center cursor-pointer select-none">
                  <span className="text-[10px] font-mono font-bold text-amber-400 leading-none">STRIPE CARD</span>
                  <span className="text-[9px] text-zinc-500 mt-1 uppercase font-mono">Real-time Mocked</span>
                </div>
                <div className="border border-zinc-800 bg-zinc-950/40 p-3 rounded-xl flex flex-col items-center justify-center cursor-not-allowed select-none opacity-40">
                  <span className="text-[10px] font-mono text-zinc-300 leading-none">Apple Pay</span>
                  <span className="text-[9px] text-zinc-600 mt-1 uppercase">Unavailable</span>
                </div>
                <div className="border border-zinc-800 bg-zinc-950/40 p-3 rounded-xl flex flex-col items-center justify-center cursor-not-allowed select-none opacity-40">
                  <span className="text-[10px] font-mono text-zinc-300 leading-none">BTC/Crypto</span>
                  <span className="text-[9px] text-zinc-600 mt-1 uppercase">Unavailable</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                id="place_order_btn"
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-3 rounded-xl text-xs uppercase tracking-wider font-display transition-colors shadow flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Place Physical Order Mock</span>
              </button>
            </div>
          </form>

          {/* Right Summary Column */}
          <div id="checkout_items_summary" className="space-y-6">
            
            {/* Item recap cards */}
            <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-5 space-y-4">
              <h3 className="font-display font-medium text-sm text-zinc-200 pb-2.5 border-b border-zinc-850">
                Items In Order ({cartItemCount})
              </h3>
              
              <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between items-center text-xs gap-3">
                    <div className="text-left">
                      <h4 className="text-zinc-200 font-medium tracking-tight truncate max-w-[160px] font-sans">{item.name}</h4>
                      <span className="text-zinc-500 font-mono text-[10px]">Qty {item.quantity} x ${item.price.toFixed(2)}</span>
                    </div>
                    <span className="font-mono text-zinc-300 shrink-0">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-zinc-850 pt-4 space-y-2.5 font-sans text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Items Subtotal</span>
                  <span className="font-mono text-zinc-300">${cartSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Courier Shipping</span>
                  <span className="font-mono text-zinc-300">${shippingCost.toFixed(2)}</span>
                </div>
                <div className="pt-3 border-t border-zinc-850 flex justify-between font-semibold">
                  <span className="text-zinc-200 text-sm">Grand Total</span>
                  <span className="font-mono text-sm text-amber-500">${cartTotal.toFixed(2)}</span>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
