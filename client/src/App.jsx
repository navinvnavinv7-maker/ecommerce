import React, { useState, useEffect, useCallback, useRef } from 'react';
import { API_URL } from './config';
import Navbar from './components/Navbar';
import SystemStatusBanner from './components/SystemStatusBanner';
import ShopView from './components/ShopView';
import CartView from './components/CartView';
import CheckoutView from './components/CheckoutView';
import AdminView from './components/AdminView';
import AdminProductForm from './components/AdminProductForm';
import DeleteProductModal from './components/DeleteProductModal';
import DeleteOrderModal from './components/DeleteOrderModal';
import AuthModal from './components/AuthModal';
import ToastNotification from './components/ToastNotification';

// ── Secure API Fetch Interceptor Wrapper ───────────────────────────────────────
// Handles Bearer auth, token rotation, and transparently supports both JSON bodies
// and FormData (multipart) bodies (no forced Content-Type for FormData).
const apiFetch = async (url, options = {}) => {
  let token = localStorage.getItem('nexus_token');

  // For FormData, let the browser set Content-Type automatically (with boundary)
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };

  let res = await fetch(url, { ...options, headers });

  // Handle Token Expiry and Attempt Rotation Intercept
  if (res.status === 401) {
    try {
      const errorClone = res.clone();
      const errorData = await errorClone.json();
      if (errorData.error === 'TokenExpired') {
        const refreshRes = await fetch(`${API_URL}/auth/refresh-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          const newToken = refreshData.token;
          localStorage.setItem('nexus_token', newToken);
          headers['Authorization'] = `Bearer ${newToken}`;
          res = await fetch(url, { ...options, headers });
        } else {
          localStorage.removeItem('nexus_token');
          localStorage.removeItem('nexus_user');
          window.location.reload();
        }
      }
    } catch (_) {}
  }

  return res;
};

// ── Shared apiFetch JSON helper ────────────────────────────────────────────────
const apiFetchJson = async (url, options = {}) => {
  const res = await apiFetch(url, options);
  try {
    return await res.json();
  } catch (_) {
    return null;
  }
};

export default function App() {
  // ── Navigation & Role State ────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('shop');
  const [adminSubTab, setAdminSubTab] = useState('products');

  // ── Auth State ─────────────────────────────────────────────────────────
  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('nexus_user') || 'null'); } catch (_) { return null; }
  });
  const [userRole, setUserRole] = useState(() => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('nexus_user') || 'null');
      return storedUser?.role === 'admin' ? 'admin' : 'customer';
    } catch (_) { return 'customer'; }
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const isAdmin = currentUser?.role === 'admin';

  // ── Product Catalog State ──────────────────────────────────────────────
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsTotal, setProductsTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // ── Filter / Search / Sort State ───────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sortBy, setSortBy] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Debounce timer ref for search
  const searchDebounceRef = useRef(null);

  // ── Orders State ───────────────────────────────────────────────────────
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // ── Cart State ─────────────────────────────────────────────────────────
  const [cart, setCart] = useState([]);

  // ── Checkout State ─────────────────────────────────────────────────────
  const [shippingForm, setShippingForm] = useState({
    fullName: '', email: '', street: '', city: '', state: '', zipCode: '', country: 'India'
  });
  const [placedOrder, setPlacedOrder] = useState(null);

  // ── Admin Product Form State ───────────────────────────────────────────
  const [showAdminProductForm, setShowAdminProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // null = adding new

  // ── Delete Confirm State ───────────────────────────────────────────────
  const [productToDelete, setProductToDelete] = useState(null);
  const [orderToDelete, setOrderToDelete] = useState(null);

  // ── Toast ──────────────────────────────────────────────────────────────
  const [toastMessage, setToastMessage] = useState(null);

  const triggerToast = (text) => {
    setToastMessage(text);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // ── Fetch Products (Paginated) ─────────────────────────────────────────
  const fetchProducts = useCallback(async (overrides = {}) => {
    setProductsLoading(true);
    const params = new URLSearchParams();

    const page = overrides.page ?? currentPage;
    const search = overrides.search ?? searchTerm;
    const sort = overrides.sort ?? sortBy;
    const catObj = overrides.category !== undefined ? overrides.category : selectedCategory;
    const min = overrides.minPrice ?? minPrice;
    const max = overrides.maxPrice ?? maxPrice;

    params.set('page', page);
    params.set('limit', 12);
    if (search) params.set('search', search);
    if (sort) params.set('sort', sort);
    if (catObj) params.set('category', catObj.slug || catObj._id || catObj);
    if (min) params.set('minPrice', min);
    if (max) params.set('maxPrice', max);

    try {
      const res = await apiFetch(`${API_URL}/products?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        // Backend returns { products, totalPages, currentPage, totalProducts }
        if (data.products !== undefined) {
          setProducts(data.products);
          setTotalPages(data.totalPages || 1);
          setCurrentPage(data.currentPage || page);
          setProductsTotal(data.totalProducts || 0);
        } else {
          // Fallback if backend returns plain array (old format)
          setProducts(data);
          setTotalPages(1);
          setProductsTotal(data.length);
        }
      }
    } catch (err) {
      console.warn('Product fetch failed, using local fallback.', err);
    } finally {
      setProductsLoading(false);
    }
  }, [currentPage, searchTerm, sortBy, selectedCategory, minPrice, maxPrice]);

  // ── Fetch Categories ────────────────────────────────────────────────────
  const fetchCategories = async () => {
    try {
      const res = await apiFetch(`${API_URL}/products/categories`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (_) {}
  };

  // ── Fetch Orders ────────────────────────────────────────────────────────
  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch(`${API_URL}/orders`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (_) {}
    setIsLoading(false);
  };

  const loadDataFromServer = async () => {
    await fetchProducts({ page: 1 });
    await fetchCategories();
    if (currentUser) await loadOrders();
  };

  // Initial load
  useEffect(() => {
    fetchProducts({ page: 1 });
    fetchCategories();
  }, []);

  // Require authentication before showing the storefront.
  useEffect(() => {
    if (!currentUser) {
      setShowAuthModal(true);
      setActiveTab('shop');
    }
  }, [currentUser]);

  // Load orders when user authenticates
  useEffect(() => {
    if (currentUser) loadOrders();
  }, [currentUser]);

  // ── Search Debounce: Re-fetch on search change ─────────────────────────
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      fetchProducts({ page: 1, search: searchTerm });
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(searchDebounceRef.current);
  }, [searchTerm]);

  // Re-fetch on filter/sort changes (immediate)
  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
    fetchProducts({ page: 1, category: cat });
  };

  const handleSortChange = (sort) => {
    setSortBy(sort);
    setCurrentPage(1);
    fetchProducts({ page: 1, sort });
  };

  const handleMinPriceChange = (val) => {
    setMinPrice(val);
    setCurrentPage(1);
    fetchProducts({ page: 1, minPrice: val });
  };

  const handleMaxPriceChange = (val) => {
    setMaxPrice(val);
    setCurrentPage(1);
    fetchProducts({ page: 1, maxPrice: val });
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchProducts({ page });
  };

  // ── Admin Product Form Handlers ────────────────────────────────────────
  const openAddForm = () => {
    setEditingProduct(null);
    setShowAdminProductForm(true);
  };

  const openEditForm = (product) => {
    setEditingProduct(product);
    setShowAdminProductForm(true);
  };

  const handleProductFormSuccess = (savedProduct, isEditing) => {
    if (isEditing) {
      setProducts(prev => prev.map(p => (p.id === savedProduct.id || p._id === savedProduct._id) ? savedProduct : p));
      triggerToast(`Updated "${savedProduct.name}" successfully.`);
    } else {
      setProducts(prev => [savedProduct, ...prev]);
      triggerToast(`Added "${savedProduct.name}" to the catalog!`);
    }
    setShowAdminProductForm(false);
    setEditingProduct(null);
    // Refresh categories in case admin added a new product that implied a new category
    fetchCategories();
  };

  // ── Delete Handlers ────────────────────────────────────────────────────
  const triggerDeleteProduct = (id, name) => setProductToDelete({ id, name });

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
    const { id, name } = productToDelete;
    try {
      const res = await apiFetch(`${API_URL}/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        // Soft delete — remove from current view
        setProducts(prev => prev.filter(p => p.id !== id && p._id !== id));
        triggerToast(`"${name}" moved to inactive status.`);
      }
    } catch (_) {
      setProducts(prev => prev.filter(p => p.id !== id));
      triggerToast(`"${name}" removed (local state).`);
    }
    setProductToDelete(null);
  };

  const triggerDeleteOrder = (id, customer) => setOrderToDelete({ id, customer });

  const confirmDeleteOrder = async () => {
    if (!orderToDelete) return;
    const { id } = orderToDelete;
    try {
      const res = await apiFetch(`${API_URL}/orders/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setOrders(prev => prev.filter(o => o.id !== id));
        triggerToast(`Order #${id} deleted.`);
      } else {
        setOrders(prev => prev.filter(o => o.id !== id));
        triggerToast(`Order #${id} removed (local).`);
      }
    } catch (_) {
      setOrders(prev => prev.filter(o => o.id !== id));
    }
    setOrderToDelete(null);
  };

  // ── Auth Handlers ──────────────────────────────────────────────────────
  const onAuthSuccess = (token, user) => {
    const normalizedRole = user?.role === 'admin' ? 'admin' : 'customer';
    const normalizedUser = { ...user, role: normalizedRole };
    localStorage.setItem('nexus_token', token);
    localStorage.setItem('nexus_user', JSON.stringify(normalizedUser));
    setCurrentUser(normalizedUser);
    setUserRole(normalizedRole);
    setActiveTab(normalizedRole === 'admin' ? 'admin' : 'shop');
  };

  const logout = async () => {
    try { await apiFetch(`${API_URL}/auth/logout`, { method: 'POST' }); } catch (_) {}
    localStorage.removeItem('nexus_token');
    localStorage.removeItem('nexus_user');
    setCurrentUser(null);
    setUserRole('customer');
    setCart([]);
    setOrders([]);
    setActiveTab('shop');
    triggerToast("Logged out successfully.");
  };

  const openLoginModal = () => setShowAuthModal(true);

  // ── Order Status Handler ───────────────────────────────────────────────
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await apiFetch(`${API_URL}/orders/${orderId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        const updated = await res.json();
        setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
        triggerToast(`Order ${orderId} → ${newStatus}.`);
      }
    } catch (_) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      triggerToast(`Order updated to ${newStatus} (local).`);
    }
  };

  // ── Place Order ────────────────────────────────────────────────────────
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!cart.length) { triggerToast("Your cart is empty."); return; }

    const subtotal = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
    const shipping = 49;
    const total = subtotal + shipping;

    const orderPayload = {
      items: cart.map(item => ({
        id: item.id || item._id,
        name: item.name,
        price: item.discountPrice || item.price,
        quantity: item.quantity,
        variantName: item.variantName || null,
        variantValue: item.variantValue || null
      })),
      shippingAddress: { ...shippingForm },
      subtotal,
      total
    };

    try {
      const res = await apiFetch(`${API_URL}/orders`, {
        method: 'POST',
        body: JSON.stringify(orderPayload)
      });
      const data = await res.json();
      if (res.ok) {
        setOrders(prev => [data, ...prev]);
        setPlacedOrder(data);
        setCart([]);
        setShippingForm({ fullName: '', email: '', street: '', city: '', state: '', zipCode: '', country: 'India' });
        // Refresh products to show updated stock levels
        fetchProducts({ page: currentPage });
      } else {
        triggerToast(`Order failed: ${data.error || 'Please try again.'}`);
      }
    } catch (err) {
      triggerToast("Could not connect to server. Please try again.");
    }
  };

  // ── Cart Helpers ───────────────────────────────────────────────────────
  const addToCart = (product, variantName = null, variantValue = null) => {
    const cartKey = variantValue ? `${product.id}_${variantValue}` : product.id;
    setCart(prev => {
      const existing = prev.find(item => item.cartKey === cartKey);
      if (existing) {
        // Respect available stock cap
        const maxStock = variantValue
          ? product.variants?.find(v => v.value === variantValue)?.stock ?? 99
          : (product.stock ?? 99);
        if (existing.quantity >= maxStock) {
          triggerToast(`Maximum stock reached for ${product.name}!`);
          return prev;
        }
        triggerToast(`Increased quantity of ${product.name}!`);
        return prev.map(item => item.cartKey === cartKey ? { ...item, quantity: item.quantity + 1 } : item);
      }
      triggerToast(`Added ${product.name} to the cart!`);
      return [...prev, {
        ...product,
        cartKey,
        quantity: 1,
        price: variantValue
          ? (product.variants?.find(v => v.value === variantValue)?.price || product.discountPrice || product.price)
          : (product.discountPrice || product.price),
        variantName,
        variantValue
      }];
    });
  };

  const updateCartQuantity = (cartKey, delta) => {
    setCart(prev =>
      prev.map(item => {
        if (item.cartKey === cartKey || item.id === cartKey) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : item;
        }
        return item;
      }).filter(item => item.quantity > 0)
    );
  };

  const removeFromCart = (cartKey, name) => {
    setCart(prev => prev.filter(item => item.cartKey !== cartKey && item.id !== cartKey));
    triggerToast(`Removed ${name} from cart.`);
  };

  // ── Derived Stats ──────────────────────────────────────────────────────
  const cartItemCount = cart.reduce((acc, i) => acc + i.quantity, 0);
  const cartSubtotal = cart.reduce((acc, i) => acc + (i.price * i.quantity), 0);
  const shippingCost = cartItemCount > 0 ? 49 : 0;
  const cartTotal = cartSubtotal + shippingCost;

  // ── Admin apiFetch wrapper (passes through to global apiFetch) ─────────
  const adminApiFetch = async (url, options = {}) => {
    const res = await apiFetch(url, options);
    try { return await res.json(); } catch (_) { return null; }
  };

  return (
    <div id="nexus_app" className="min-h-screen bg-zinc-950 flex flex-col text-zinc-100 flex-1 relative selection:bg-amber-500 selection:text-zinc-950">

      <ToastNotification toastMessage={toastMessage} />

      <SystemStatusBanner
        isLoading={isLoading}
        loadDataFromServer={loadDataFromServer}
        currentUser={currentUser}
      />

      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cartItemCount={cartItemCount}
        loadDataFromServer={loadDataFromServer}
        isLoading={isLoading}
        triggerToast={triggerToast}
        currentUser={currentUser}
        logout={logout}
        openLoginModal={openLoginModal}
      />

      <main id="primary_viewport" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {!currentUser && (
          <div className="min-h-[55vh] flex items-center justify-center text-center">
            <div className="max-w-md space-y-3">
              <div className="mx-auto w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center font-display text-amber-500 font-bold">
                N
              </div>
              <h1 className="text-2xl font-display font-semibold text-white">Sign in to continue</h1>
              <p className="text-sm text-zinc-500">
                Your account email decides the available workspace. Owner emails from server configuration unlock Merchant operations.
              </p>
            </div>
          </div>
        )}

        {/* VIEW 1: Shop */}
        {currentUser && activeTab === 'shop' && (
          <ShopView
            products={products}
            addToCart={addToCart}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedCategory={selectedCategory}
            setSelectedCategory={handleCategoryChange}
            categories={categories}
            currentPage={currentPage}
            totalPages={totalPages}
            totalProducts={productsTotal}
            onPageChange={handlePageChange}
            sortBy={sortBy}
            onSortChange={handleSortChange}
            minPrice={minPrice}
            maxPrice={maxPrice}
            onMinPriceChange={handleMinPriceChange}
            onMaxPriceChange={handleMaxPriceChange}
            loading={productsLoading}
          />
        )}

        {/* VIEW 2: Cart */}
        {currentUser && activeTab === 'cart' && (
          <CartView
            cart={cart}
            updateCartQuantity={updateCartQuantity}
            removeFromCart={removeFromCart}
            setActiveTab={setActiveTab}
            cartItemCount={cartItemCount}
            cartSubtotal={cartSubtotal}
            shippingCost={shippingCost}
            cartTotal={cartTotal}
          />
        )}

        {/* VIEW 3: Checkout */}
        {currentUser && activeTab === 'checkout' && (
          <CheckoutView
            cart={cart}
            placedOrder={placedOrder}
            setPlacedOrder={setPlacedOrder}
            shippingForm={shippingForm}
            setShippingForm={setShippingForm}
            handlePlaceOrder={handlePlaceOrder}
            cartItemCount={cartItemCount}
            cartSubtotal={cartSubtotal}
            shippingCost={shippingCost}
            cartTotal={cartTotal}
            userRole={isAdmin ? 'admin' : 'customer'}
            setAdminSubTab={setAdminSubTab}
            setActiveTab={setActiveTab}
          />
        )}

        {/* VIEW 4: Admin */}
        {currentUser && activeTab === 'admin' && isAdmin && (
          <AdminView
            adminSubTab={adminSubTab}
            setAdminSubTab={setAdminSubTab}
            products={products}
            orders={orders}
            openAddForm={openAddForm}
            openEditForm={openEditForm}
            triggerDeleteProduct={triggerDeleteProduct}
            handleUpdateOrderStatus={handleUpdateOrderStatus}
            triggerDeleteOrder={triggerDeleteOrder}
          />
        )}

      </main>

      {/* Admin Product Form Modal */}
      {showAdminProductForm && (
        <AdminProductForm
          product={editingProduct}
          categories={categories}
          apiFetch={adminApiFetch}
          onSuccess={handleProductFormSuccess}
          onClose={() => { setShowAdminProductForm(false); setEditingProduct(null); }}
        />
      )}

      <DeleteProductModal
        productToDelete={productToDelete}
        setProductToDelete={setProductToDelete}
        confirmDeleteProduct={confirmDeleteProduct}
      />

      <DeleteOrderModal
        orderToDelete={orderToDelete}
        setOrderToDelete={setOrderToDelete}
        confirmDeleteOrder={confirmDeleteOrder}
      />

      <AuthModal
        showAuthModal={showAuthModal}
        setShowAuthModal={setShowAuthModal}
        onAuthSuccess={onAuthSuccess}
        triggerToast={triggerToast}
        requireAuth={!currentUser}
      />

      <footer id="app_footer" className="bg-zinc-950 border-t border-zinc-900 py-12 mt-16 text-center text-xs text-zinc-500 space-y-4">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] text-zinc-400 font-bold">N</div>
            <span className="font-display font-medium tracking-widest text-zinc-400">NEXUS COUTURE // FULL STACK PREVIEW</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
