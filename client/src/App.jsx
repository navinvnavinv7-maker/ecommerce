import React, { useState, useEffect } from 'react';
import { API_URL } from './config';
import Navbar from './components/Navbar';
import SystemStatusBanner from './components/SystemStatusBanner';
import ShopView from './components/ShopView';
import CartView from './components/CartView';
import CheckoutView from './components/CheckoutView';
import AdminView from './components/AdminView';
import ProductModal from './components/ProductModal';
import DeleteProductModal from './components/DeleteProductModal';
import DeleteOrderModal from './components/DeleteOrderModal';
import AuthModal from './components/AuthModal';
import ToastNotification from './components/ToastNotification';

export default function App() {
  // Navigation & Role State
  const [activeTab, setActiveTab] = useState('shop'); // 'shop', 'cart', 'checkout', 'admin'
  const [adminSubTab, setAdminSubTab] = useState('products'); // 'products', 'orders'
  const [userRole, setUserRole] = useState('customer'); // 'customer', 'admin'
  const [isLoading, setIsLoading] = useState(false);

  // Authentication State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('nexus_user');
      return stored ? JSON.parse(stored) : null;
    } catch (_) {
      return null;
    }
  });
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Data State
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Checkout Form State
  const [shippingForm, setShippingForm] = useState({
    fullName: '',
    email: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA'
  });

  // Admin Form State (Add / Edit Product)
  const [isEditing, setIsEditing] = useState(false);
  const [productForm, setProductForm] = useState({
    id: '',
    name: '',
    price: '',
    category: 'Peripherals',
    image: 'from-zinc-700 to-zinc-800',
    description: ''
  });
  const [showProductModal, setShowProductModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [orderToDelete, setOrderToDelete] = useState(null);

  // Notification / Confirmation states
  const [toastMessage, setToastMessage] = useState(null);
  const [placedOrder, setPlacedOrder] = useState(null);

  // Default Fallbacks in case fetch fails
  const localProductsFallback = [
    {
      id: "p1",
      name: "Apex Pro Mechanical Keyboard",
      price: 189.99,
      category: "Peripherals",
      rating: 4.8,
      reviewsCount: 124,
      description: "OmniPoint adjustable switches and anodized black aluminum frame with customizable RGB lighting.",
      image: "from-indigo-600 to-purple-600"
    },
    {
      id: "p2",
      name: "Aero-X ANC Wireless Headphones",
      price: 299.99,
      category: "Audio",
      rating: 4.9,
      reviewsCount: 87,
      description: "Studio-grade sound profiles with adaptive active noise cancellation and 40-hour deep battery life.",
      image: "from-cyan-600 to-blue-600"
    },
    {
      id: "p3",
      name: "Quantum Desk Light Bar",
      price: 79.99,
      category: "Accessories",
      rating: 4.6,
      reviewsCount: 62,
      description: "Asymmetric optical glare-reduction with dual ambient glow backlighting and high-accuracy wireless dial.",
      image: "from-amber-500 to-orange-600"
    },
    {
      id: "p4",
      name: "Ergoprop Bamboo standing Desk",
      price: 549.99,
      category: "Furniture",
      rating: 4.7,
      reviewsCount: 45,
      description: "Dual motors workspace desk with native organic bamboo top, smart memory control presets, and safety collision stop.",
      image: "from-emerald-600 to-teal-700"
    },
    {
      id: "p5",
      name: "Nomad Daily Packable Backpack",
      price: 129.99,
      category: "Accessories",
      rating: 4.5,
      reviewsCount: 39,
      description: "Cordura weatherproof fabric with dual clamshell compartments and secure passport protection pocket.",
      image: "from-rose-500 to-pink-600"
    },
    {
      id: "p6",
      name: "Eclipse QD-OLED UltraWide Monitor",
      price: 899.99,
      category: "Monitors",
      rating: 4.9,
      reviewsCount: 73,
      description: "34-inch QD-OLED professional curved panel with rapid 175Hz refresh and back-channel active sync lighting.",
      image: "from-violet-600 to-fuchsia-600"
    }
  ];

  const localOrdersFallback = [
    {
      id: "ord-8831",
      date: "2026-06-05T10:14:00Z",
      customer: "Jane Cooper",
      email: "jane.cooper@example.com",
      items: [{ id: "p1", name: "Apex Pro Mechanical Keyboard", price: 189.99, quantity: 1 }],
      shippingAddress: { fullName: "Jane Cooper", street: "1248 Oakwood Ave", city: "San Francisco", state: "CA", zipCode: "94107", country: "USA" },
      subtotal: 189.99,
      total: 199.98,
      status: "Processing"
    },
    {
      id: "ord-4209",
      date: "2026-06-04T16:45:00Z",
      customer: "Alex Rivera",
      email: "alex.rivera@example.com",
      items: [
        { id: "p3", name: "Quantum Desk Light Bar", price: 79.99, quantity: 2 },
        { id: "p5", name: "Nomad Daily Packable Backpack", price: 129.99, quantity: 1 }
      ],
      shippingAddress: { fullName: "Alex Rivera", street: "702 Broad St", city: "Austin", state: "TX", zipCode: "78701", country: "USA" },
      subtotal: 289.97,
      total: 299.96,
      status: "Shipped"
    }
  ];

  // Helper: Trigger custom toast banner
  const triggerToast = (text) => {
    setToastMessage(text);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Fetch initial catalog and orders from Server API on load
  const loadDataFromServer = async () => {
    setIsLoading(true);
    try {
      const pRes = await fetch(`${API_URL}/products`);
      if (pRes.ok) {
        const pData = await pRes.json();
        setProducts(pData);
      } else {
        setProducts(localProductsFallback);
      }
    } catch (e) {
      console.warn("Backend API not reachable. Operating on synced frontend local memory states.", e);
      setProducts(localProductsFallback);
    }

    try {
      const oRes = await fetch(`${API_URL}/orders`);
      if (oRes.ok) {
        const oData = await oRes.json();
        setOrders(oData);
      } else {
        setOrders(localOrdersFallback);
      }
    } catch (e) {
      setOrders(localOrdersFallback);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadDataFromServer();
  }, []);

  // Sync state helpers
  const handleAddProduct = async (e) => {
    e.preventDefault();
    const payload = {
      name: productForm.name,
      price: parseFloat(productForm.price),
      category: productForm.category,
      description: productForm.description,
      image: productForm.image
    };

    try {
      const res = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const newProd = await res.json();
        setProducts(prev => [newProd, ...prev]);
        triggerToast(`Added "${newProd.name}" successfully to Express DB!`);
      } else {
        // Fallback local memory
        const fakeProduct = {
          id: "p_" + Date.now(),
          ...payload,
          rating: 5.0,
          reviewsCount: 0
        };
        setProducts(prev => [fakeProduct, ...prev]);
        triggerToast(`Added "${fakeProduct.name}" (Local-mode fallback)`);
      }
    } catch (err) {
      const fakeProduct = {
        id: "p_" + Date.now(),
        ...payload,
        rating: 5.0,
        reviewsCount: 0
      };
      setProducts(prev => [fakeProduct, ...prev]);
      triggerToast(`Added "${fakeProduct.name}" (Local-mode filesystem)`);
    }

    // Reset Form
    setProductForm({
      id: '',
      name: '',
      price: '',
      category: 'Peripherals',
      image: 'from-zinc-700 to-zinc-800',
      description: ''
    });
    setShowProductModal(false);
  };

  const handleEditProduct = async (e) => {
    e.preventDefault();
    const payload = {
      name: productForm.name,
      price: parseFloat(productForm.price),
      category: productForm.category,
      description: productForm.description,
      image: productForm.image
    };

    try {
      const res = await fetch(`${API_URL}/products/${productForm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const updatedProd = await res.json();
        setProducts(prev => prev.map(p => p.id === updatedProd.id ? updatedProd : p));
        triggerToast(`Updated "${updatedProd.name}" on Express database.`);
      } else {
        setProducts(prev => prev.map(p => p.id === productForm.id ? { ...p, ...payload } : p));
        triggerToast(`Updated product (Local model fallback)`);
      }
    } catch (err) {
      setProducts(prev => prev.map(p => p.id === productForm.id ? { ...p, ...payload } : p));
      triggerToast(`Updated product (Local filesystem index)`);
    }

    setShowProductModal(false);
    setIsEditing(false);
  };

  const triggerDeleteProduct = (id, name) => {
    setProductToDelete({ id, name });
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
    const { id, name } = productToDelete;

    try {
      const res = await fetch(`${API_URL}/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProducts(prev => prev.filter(p => p.id !== id));
        triggerToast(`Deleted "${name}" from backend catalog.`);
      } else {
        setProducts(prev => prev.filter(p => p.id !== id));
        triggerToast(`Deleted "${name}" (Local state update)`);
      }
    } catch (err) {
      setProducts(prev => prev.filter(p => p.id !== id));
      triggerToast(`Deleted "${name}" (Local state update)`);
    }
    setProductToDelete(null);
  };

  const triggerDeleteOrder = (id, customer) => {
    setOrderToDelete({ id, customer });
  };

  const confirmDeleteOrder = async () => {
    if (!orderToDelete) return;
    const { id } = orderToDelete;

    try {
      const res = await fetch(`${API_URL}/orders/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setOrders(prev => prev.filter(o => o.id !== id));
        triggerToast(`Deleted order #${id} from checkouts.`);
      } else {
        setOrders(prev => prev.filter(o => o.id !== id));
        triggerToast(`Deleted order #${id} (Local update)`);
      }
    } catch (err) {
      setOrders(prev => prev.filter(o => o.id !== id));
      triggerToast(`Deleted order #${id} (Local update)`);
    }
    setOrderToDelete(null);
  };

  // Auth Operations
  const onAuthSuccess = (token, user) => {
    localStorage.setItem('nexus_token', token);
    localStorage.setItem('nexus_user', JSON.stringify(user));
    setCurrentUser(user);
    if (user.role) {
      setUserRole(user.role);
    }
  };

// Add setCart([]) to logout in App.jsx
const logout = () => {
  localStorage.removeItem('nexus_token');
  localStorage.removeItem('nexus_user');
  setCurrentUser(null);
  setUserRole('customer');
  setCart([]);        // ← add this!
  setActiveTab('shop');
  triggerToast("Logged out successfully.");
};

  const openLoginModal = () => {
    setShowAuthModal(true);
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        const updatedOrd = await res.json();
        setOrders(prev => prev.map(o => o.id === updatedOrd.id ? updatedOrd : o));
        triggerToast(`Order ${orderId} updated to ${newStatus}.`);
      } else {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        triggerToast(`Order updated to ${newStatus} (Local)`);
      }
    } catch (err) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      triggerToast(`Order updated to ${newStatus} (Local)`);
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!cart.length) {
      triggerToast("Your cart is empty.");
      return;
    }

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = 9.99;
    const total = subtotal + shipping;

    const orderPayload = {
      items: cart.map(item => ({ id: item.id, name: item.name, price: item.price, quantity: item.quantity })),
      shippingAddress: { ...shippingForm },
      email: shippingForm.email,
      subtotal,
      total
    };

    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });
      if (res.ok) {
        const responseData = await res.json();
        setOrders(prev => [responseData, ...prev]);
        setPlacedOrder(responseData);
      } else {
        const localOrder = {
          id: "ord-" + Math.floor(1000 + Math.random() * 9000),
          date: new Date().toISOString(),
          customer: shippingForm.fullName,
          email: shippingForm.email,
          items: orderPayload.items,
          shippingAddress: orderPayload.shippingAddress,
          subtotal,
          total,
          status: "Pending"
        };
        setOrders(prev => [localOrder, ...prev]);
        setPlacedOrder(localOrder);
      }
    } catch (err) {
      const localOrder = {
        id: "ord-" + Math.floor(1000 + Math.random() * 9000),
        date: new Date().toISOString(),
        customer: shippingForm.fullName,
        email: shippingForm.email,
        items: orderPayload.items,
        shippingAddress: orderPayload.shippingAddress,
        subtotal,
        total,
        status: "Pending"
      };
      setOrders(prev => [localOrder, ...prev]);
      setPlacedOrder(localOrder);
    }

    // Reset cart and checkout states
    setCart([]);
    setShippingForm({
      fullName: '',
      email: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA'
    });
  };

  // Cart Helper functions
  const addToCart = (product) => {
    setCart(prevCart => {
      const existing = prevCart.find(item => item.id === product.id);
      if (existing) {
        triggerToast(`Increased quantity of ${product.name}!`);
        return prevCart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      triggerToast(`Added ${product.name} to the cart!`);
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const updateCartQuantity = (productId, delta) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.id === productId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : item;
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  const removeFromCart = (productId, name) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
    triggerToast(`Removed ${name} from cart.`);
  };

  // Calculated Stats
  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const shippingCost = cartItemCount > 0 ? 9.99 : 0;
  const cartTotal = cartSubtotal + shippingCost;

  // Filter products live
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const uniqueCategories = ['All', 'Peripherals', 'Audio', 'Accessories', 'Furniture', 'Monitors'];

  // Open Add Product form
  const openAddForm = () => {
    setProductForm({
      id: '',
      name: '',
      price: '',
      category: 'Peripherals',
      image: 'from-zinc-700 to-zinc-800',
      description: ''
    });
    setIsEditing(false);
    setShowProductModal(true);
  };

  // Open Edit Product form
  const openEditForm = (prod) => {
    setProductForm({ ...prod });
    setIsEditing(true);
    setShowProductModal(true);
  };

  const gradientOptions = [
    { label: "Indigo & Royal", value: "from-indigo-600 to-purple-600" },
    { label: "Ocean Cyan", value: "from-cyan-600 to-blue-600" },
    { label: "Zen Emerald", value: "from-emerald-600 to-teal-700" },
    { label: "Warm Amber", value: "from-amber-500 to-orange-600" },
    { label: "Neon Raspberry", value: "from-rose-500 to-pink-600" },
    { label: "Deep Sunset Cosmic", value: "from-violet-600 to-fuchsia-600" },
    { label: "Industrial Charcoal", value: "from-zinc-700 to-zinc-800" }
  ];

  return (
    <div id="nexus_app" className="min-h-screen bg-zinc-950 flex flex-col text-zinc-100 flex-1 relative selection:bg-amber-500 selection:text-zinc-950">
      
      {/* Toast Notifications */}
      <ToastNotification toastMessage={toastMessage} />

      {/* Global Quick Banner Context Indicator */}
      <SystemStatusBanner
        isLoading={isLoading}
        loadDataFromServer={loadDataFromServer}
        userRole={userRole}
        setUserRole={setUserRole}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        triggerToast={triggerToast}
      />

      {/* Top Application Header / Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userRole={userRole}
        setUserRole={setUserRole}
        cartItemCount={cartItemCount}
        loadDataFromServer={loadDataFromServer}
        isLoading={isLoading}
        triggerToast={triggerToast}
        currentUser={currentUser}
        logout={logout}
        openLoginModal={openLoginModal}
      />

      {/* Primary Canvas Container */}
      <main id="primary_viewport" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* VIEW 1: Home/Products Shop Page */}
        {activeTab === 'shop' && (
          <ShopView
            filteredProducts={filteredProducts}
            addToCart={addToCart}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            uniqueCategories={uniqueCategories}
          />
        )}

        {/* VIEW 2: Detailed Cart Page */}
        {activeTab === 'cart' && (
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

        {/* VIEW 3: Checkout Page */}
        {activeTab === 'checkout' && (
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
            userRole={userRole}
            setAdminSubTab={setAdminSubTab}
            setActiveTab={setActiveTab}
          />
        )}

        {/* VIEW 4: Admin Panel */}
        {activeTab === 'admin' && userRole === 'admin' && (
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

      {/* Admin New/Edit Modal Dialog */}
      <ProductModal
        showProductModal={showProductModal}
        setShowProductModal={setShowProductModal}
        isEditing={isEditing}
        productForm={productForm}
        setProductForm={setProductForm}
        handleEditProduct={handleEditProduct}
        handleAddProduct={handleAddProduct}
        gradientOptions={gradientOptions}
      />

      {/* Admin Delete Confirmation Modal */}
      <DeleteProductModal
        productToDelete={productToDelete}
        setProductToDelete={setProductToDelete}
        confirmDeleteProduct={confirmDeleteProduct}
      />

      {/* Customer Order Delete Confirmation Modal */}
      <DeleteOrderModal
        orderToDelete={orderToDelete}
        setOrderToDelete={setOrderToDelete}
        confirmDeleteOrder={confirmDeleteOrder}
      />

      {/* User Login/Registration Modal */}
      <AuthModal
        showAuthModal={showAuthModal}
        setShowAuthModal={setShowAuthModal}
        onAuthSuccess={onAuthSuccess}
        triggerToast={triggerToast}
      />

      {/* Footer */}
      <footer id="app_footer" className="bg-zinc-950 border-t border-zinc-900 py-12 mt-16 text-center text-xs text-zinc-500 space-y-4">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] text-zinc-400 font-bold">
              N
            </div>
            <span className="font-display font-medium tracking-widest text-zinc-400">NEXUS COUTURE // FULL STACK PREVIEW</span>
          </div>

        </div>
      </footer>

    </div>
  );
}
