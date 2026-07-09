import React from 'react';
import { Package, ShoppingCart, DollarSign, Users, PlusCircle, Edit, Trash2 } from 'lucide-react';

export default function AdminView({
  adminSubTab,
  setAdminSubTab,
  products,
  orders,
  openAddForm,
  openEditForm,
  triggerDeleteProduct,
  handleUpdateOrderStatus,
  triggerDeleteOrder,
  envStatus
}) {
  const pendingOrdersCount = orders.filter(o => o.status === 'Pending').length;
  const deliveredOrdersCount = orders.filter(o => o.status === 'Delivered').length;
  const deliveredPercentage = orders.length > 0 ? Math.round((deliveredOrdersCount / orders.length) * 100) : 0;
  return (
    <div id="admin_view" className="space-y-8 text-left animate-fade-in">
      
      {/* Admin Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-900">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-indigo-950 text-indigo-400 border border-indigo-800/80 text-[10px] uppercase tracking-widest px-2.5 py-0.5 rounded-full font-semibold">
              Developer Portal
            </span>
            <span className="text-xs font-mono text-zinc-500">MERN State Database</span>
          </div>
          <h2 className="text-3xl font-display font-semibold tracking-tight text-white mt-1 font-display">Merchant Storefront Manager</h2>
        </div>
        
        {/* Internal toggle tabs */}
        <div id="admin_subtab_triggers" className="bg-zinc-900 p-1 rounded-xl border border-zinc-800 flex gap-1 self-start md:self-auto">
          <button
            id="tab_admin_products_trigger"
            onClick={() => setAdminSubTab('products')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${adminSubTab === 'products' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            Products Catalog ({products.length})
          </button>
          <button
            id="tab_admin_orders_trigger"
            onClick={() => setAdminSubTab('orders')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${adminSubTab === 'orders' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            Customer Orders ({orders.length})
          </button>
        </div>
      </div>

      {/* Quick Metrics Cards */}
      <div id="admin_metrics_row" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/40 border border-zinc-900 p-4 rounded-xl text-left space-y-1">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-[10px] font-mono tracking-wider uppercase">Active Catalog</span>
            <Package className="w-4 h-4 text-zinc-500" />
          </div>
          <strong className="text-2xl font-mono text-white block leading-none">{products.length}</strong>
          <span className="text-[9px] text-zinc-500 block">Total active hardware SKUs</span>
        </div>

        <div className="bg-zinc-900/40 border border-zinc-900 p-4 rounded-xl text-left space-y-1">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-[10px] font-mono tracking-wider uppercase">Order Tickets</span>
            <ShoppingCart className="w-4 h-4 text-zinc-500" />
          </div>
          <strong className="text-2xl font-mono text-amber-500 block leading-none">{orders.length}</strong>
          <span className="text-[9px] text-zinc-400 block font-medium">{pendingOrdersCount} orders pending</span>
        </div>

        <div className="bg-zinc-900/40 border border-zinc-900 p-4 rounded-xl text-left space-y-1">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-[10px] font-mono tracking-wider uppercase">Projected Sales</span>
            <DollarSign className="w-4 h-4 text-zinc-500" />
          </div>
          <strong className="text-2xl font-mono text-emerald-400 block leading-none">
            ${orders.reduce((sum, o) => sum + o.total, 0).toFixed(2)}
          </strong>
          <span className="text-[9px] text-zinc-400 block font-medium">{deliveredPercentage}% delivered</span>
        </div>

        <div className="bg-zinc-900/40 border border-zinc-900 p-4 rounded-xl text-left space-y-1">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[10px] font-mono tracking-wider uppercase">Visitor Database</span>
            <Users className="w-4 h-4 text-zinc-400" />
          </div>
          <strong className="text-2xl font-mono text-indigo-400 block leading-none">1</strong>
          <span className="text-[9px] text-zinc-500 block">Express JWT credentials in memory</span>
        </div>
      </div>

      {/* SUB-TAB: Product management table */}
      {adminSubTab === 'products' && (
        <div id="admin_products_manager" className="space-y-4">
          
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-display font-medium text-base text-zinc-200">Catalog SKUs Management</h3>
              <p className="text-zinc-500 text-xs mt-0.5 font-sans">Edit hardware attributes or create new catalog products directly on the Express state.</p>
            </div>
            <button
              id="add_new_product_btn"
              onClick={openAddForm}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-4 py-2.5 rounded-lg flex items-center gap-1.5 cursor-pointer shadow transition-colors"
            >
              <PlusCircle className="w-4.5 h-4.5" />
              <span>Create Catalog Product</span>
            </button>
          </div>

          {/* Table Layout */}
          <div className="bg-zinc-900/30 border border-zinc-900 rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[820px]">
                <thead>
                  <tr className="border-b border-zinc-900 bg-zinc-950 text-zinc-500 text-[10px] uppercase tracking-wider font-mono">
                    <th className="p-4">Image / SKU</th>
                    <th className="p-4">Product Name</th>
                    <th className="p-4">Category</th>
                    <th className="p-4 text-center">Stock</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Pricing</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900 text-xs text-zinc-300">
                  {products.map(p => {
                    const mainImage = p.images?.find(i => i.isPrimary)?.url || p.images?.[0]?.url || p.image;
                    const isGrad = mainImage && mainImage.startsWith('from-');
                    const categoryName = p.category?.name || p.category || '—';
                    const hasDiscount = p.discountPrice && p.discountPrice < p.price;
                    const stockLevel = p.stock ?? null;

                    return (
                      <tr key={p.id || p._id} className="hover:bg-zinc-900/20 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg shrink-0 border border-zinc-800 overflow-hidden bg-zinc-900 flex items-center justify-center">
                              {isGrad ? (
                                <div className={`w-full h-full bg-gradient-to-br ${mainImage}`} />
                              ) : mainImage ? (
                                <img src={mainImage} alt={p.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-800" />
                              )}
                            </div>
                            <div>
                              {p.sku && <span className="text-[10px] font-mono text-zinc-500 block">{p.sku}</span>}
                              <span className="text-[10px] font-mono text-zinc-700">{p.id || p._id}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-medium text-zinc-100 max-w-[180px]">
                          <div className="line-clamp-1">{p.name}</div>
                          {p.brand && <div className="text-[10px] text-zinc-500 font-mono">{p.brand}</div>}
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded bg-zinc-850 border border-zinc-800 text-zinc-400 text-[10px] font-medium inline-block">
                            {categoryName}
                          </span>
                        </td>
                        <td className="p-4 text-center font-mono">
                          {stockLevel === null ? (
                            <span className="text-zinc-600">—</span>
                          ) : stockLevel === 0 ? (
                            <span className="text-red-400 font-semibold">Out of Stock</span>
                          ) : stockLevel <= 5 ? (
                            <span className="text-amber-400 font-semibold">{stockLevel} left</span>
                          ) : (
                            <span className="text-zinc-300">{stockLevel}</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                            p.status === 'active' ? 'bg-green-950/40 border-green-800 text-green-400' :
                            p.status === 'draft' ? 'bg-zinc-800 border-zinc-700 text-zinc-400' :
                            p.status === 'archived' ? 'bg-zinc-900 border-zinc-800 text-zinc-600' :
                            'bg-red-950/40 border-red-900 text-red-400'
                          }`}>
                            {p.status || 'active'}
                          </span>
                        </td>
                        <td className="p-4 text-right font-mono">
                          {hasDiscount ? (
                            <div>
                              <div className="text-[10px] text-zinc-600 line-through">₹{Number(p.price).toLocaleString('en-IN')}</div>
                              <div className="text-amber-400 font-semibold">₹{Number(p.discountPrice).toLocaleString('en-IN')}</div>
                            </div>
                          ) : (
                            <span className="text-amber-500 font-semibold">₹{Number(p.price).toLocaleString('en-IN')}</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              id={`edit_proc_${p.id || p._id}`}
                              onClick={() => openEditForm(p)}
                              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-all cursor-pointer"
                              title="Edit product"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              id={`delete_proc_${p.id || p._id}`}
                              onClick={() => triggerDeleteProduct(p.id || p._id, p.name)}
                              className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-zinc-800/40 rounded transition-all cursor-pointer"
                              title="Deactivate product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}


      {/* SUB-TAB: Orders management table */}
      {adminSubTab === 'orders' && (
        <div id="admin_orders_manager" className="space-y-4">
          
          <div>
            <h3 className="font-display font-medium text-base text-zinc-200">Customer Order Queue</h3>
            <p className="text-zinc-500 text-xs mt-0.5 font-sans">Control shipping states, update workflows from validation back to logistics.</p>
          </div>

          <div className="bg-zinc-900/30 border border-zinc-900 rounded-xl overflow-hidden shadow-xl">
            {orders.length === 0 ? (
              <div className="text-center py-20 text-zinc-500">
                <span className="text-5xl block mb-4 filter select-none">📋</span>
                <p className="font-display font-medium text-zinc-300 text-base">No orders yet</p>
                <p className="text-zinc-500 text-xs mt-1 font-sans font-medium">Submit a checkout order to see it listed here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[750px]">
                  <thead>
                    <tr className="border-b border-zinc-900 bg-zinc-950 text-zinc-500 text-[10px] uppercase tracking-wider font-mono">
                      <th className="p-4">Ticket Serial</th>
                      <th className="p-4">Date Submitted</th>
                      <th className="p-4">Customer Contact</th>
                      <th className="p-4 text-right">Sum Charged</th>
                      <th className="p-4 text-center">Logistic Status Badge</th>
                      <th className="p-4 text-right">Modify Status</th>
                      <th className="p-4 text-center">Operation Settings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900 text-xs text-zinc-300">
                    {orders.map(order => (
                      <tr key={order.id} className="hover:bg-zinc-900/20 transition-colors">
                        <td className="p-4 font-mono font-bold text-zinc-200">{order.id}</td>
                        <td className="p-4 font-mono text-zinc-400">
                          {new Date(order.date).toLocaleDateString() || order.date}
                        </td>
                        <td className="p-4 text-left">
                          <div className="font-medium text-zinc-100">{order.customer}</div>
                          <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{order.email}</div>
                        </td>
                        <td className="p-4 text-right font-mono font-semibold text-amber-500">
                          ${order.total.toFixed(2)}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-semibold uppercase ${
                            order.status === 'Pending' ? 'bg-yellow-950/40 border-yellow-800 text-yellow-400' :
                            order.status === 'Processing' ? 'bg-purple-950/40 border-purple-800 text-purple-400' :
                            order.status === 'Shipped' ? 'bg-blue-950/40 border-blue-800 text-blue-400' :
                            'bg-green-950/40 border-green-800 text-green-400'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              order.status === 'Pending' ? 'bg-yellow-400 animate-pulse' :
                              order.status === 'Processing' ? 'bg-purple-400' :
                              order.status === 'Shipped' ? 'bg-blue-400' :
                              'bg-green-400'
                            }`} />
                            {order.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <select
                            id={`order_status_select_${order.id}`}
                            value={order.status}
                            onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                            className="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Processing">Processing</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                          </select>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            id={`delete_order_${order.id}`}
                            onClick={() => triggerDeleteOrder(order.id, order.customer)}
                            className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-zinc-800/40 rounded transition-all cursor-pointer inline-flex items-center"
                            title="Delete customer order"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
