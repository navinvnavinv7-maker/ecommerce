import React from 'react';
import { ShoppingCart, User, RefreshCw, Layers } from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  cartItemCount,
  loadDataFromServer,
  isLoading,
  triggerToast,
  currentUser,
  logout,
  openLoginModal
}) {
  const isAdmin = currentUser?.role === 'admin';

  return (
    <header id="app_navbar" className="sticky top-0 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-900 z-40 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div 
          id="brand_logo_ct"
          onClick={() => setActiveTab('shop')} 
          className="flex items-center gap-2.5 cursor-pointer select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 p-0.5 flex items-center justify-center font-display font-black text-white text-xl">
            N
          </div>
          <div className="flex flex-col">
            <span className="font-display font-medium tracking-widest text-[#FFF] leading-none text-base">NEXUS</span>
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">COUTURE SHOP</span>
          </div>
        </div>

        {/* Center Tabs Navigation */}
        <nav id="nav_links_container" className="hidden md:flex items-center gap-1.5">
          <button
            id="tab_shop_btn"
            onClick={() => setActiveTab('shop')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${activeTab === 'shop' ? 'bg-zinc-900 text-white border border-zinc-800/80 shadow' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            Shop Catalog
          </button>
          <button
            id="tab_cart_btn"
            onClick={() => setActiveTab('cart')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'cart' ? 'bg-zinc-900 text-white border border-zinc-800/80 shadow' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            My Cart
            {cartItemCount > 0 && (
              <span className="bg-amber-500 text-zinc-950 text-xs font-bold px-1.5 py-0.5 rounded-full inline-block min-w-4 text-center">
                {cartItemCount}
              </span>
            )}
          </button>
          <button
            id="tab_checkout_btn"
            onClick={() => setActiveTab('checkout')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${activeTab === 'checkout' ? 'bg-zinc-900 text-white border border-zinc-800/80 shadow' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            Checkout Form
          </button>
          {isAdmin && (
            <button
              id="tab_admin_btn"
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'admin' ? 'bg-indigo-950/50 border border-indigo-800/60 text-indigo-200' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Layers className="w-4 h-4 text-indigo-400" />
              Admin Panel
            </button>
          )}
        </nav>

        {/* End Action Widgets */}
        <div id="nav_right_actions" className="flex items-center gap-4">
          
          {/* Direct Cart Button with Badge */}
          <button 
            id="cart_toggle_short"
            onClick={() => setActiveTab('cart')}
            className="relative p-2 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <ShoppingCart className="w-6 h-6" />
            {cartItemCount > 0 ? (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-zinc-950 font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                {cartItemCount}
              </span>
            ) : null}
          </button>

          {/* Authenticated Profile or Login action */}
          <div id="profile_meta_indicator" className="flex items-center gap-2.5 border-l border-zinc-900 pl-4 select-none">
            {currentUser ? (
              <>
                <div className="w-8 h-8 rounded-full bg-indigo-950/50 border border-indigo-800/60 flex items-center justify-center text-xs font-bold text-indigo-400 shrink-0">
                  {currentUser.username.substring(0, 2).toUpperCase()}
                </div>
                <div className="hidden lg:flex flex-col text-left">
                  <span className="text-xs font-semibold text-zinc-200 capitalize truncate max-w-[110px]" title={currentUser.username}>
                    {currentUser.username}
                  </span>
                  <button
                    onClick={logout}
                    className="text-[9px] font-mono text-rose-400 hover:text-rose-300 font-semibold text-left transition-colors cursor-pointer"
                  >
                    Logout session
                  </button>
                </div>
              </>
            ) : (
              <>
                <div 
                  onClick={openLoginModal}
                  className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-850 flex items-center justify-center cursor-pointer hover:border-amber-500/50 transition-colors"
                >
                  <User className="w-4 h-4 text-zinc-500" />
                </div>
                <div className="hidden lg:flex flex-col text-left">
                  <span 
                    onClick={openLoginModal}
                    className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Guest customer
                  </span>
                  <button
                    onClick={openLoginModal}
                    className="text-[9px] font-mono text-amber-500/80 hover:text-amber-450 font-semibold text-left transition-colors cursor-pointer"
                  >
                    Sign in profile
                  </button>
                </div>
              </>
            )}
          </div>
          
          {/* Mobile Nav Trigger Alert */}
          <div className="md:hidden flex items-center">
            <select
              id="mobile_view_selector"
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-lg px-2 py-1.5"
            >
              <option value="shop">Shop Catalog</option>
              <option value="cart">My Cart ({cartItemCount})</option>
              <option value="checkout">Checkout</option>
              {isAdmin && <option value="admin">Admin Dashboard</option>}
            </select>
          </div>

        </div>

      </div>
    </header>
  );
}
