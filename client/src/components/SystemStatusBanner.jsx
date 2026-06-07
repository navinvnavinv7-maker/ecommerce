import React from 'react';
import { RefreshCw } from 'lucide-react';

export default function SystemStatusBanner({
  isLoading,
  loadDataFromServer,
  userRole,
  setUserRole,
  activeTab,
  setActiveTab,
  triggerToast
}) {
  return (
    <div id="global_status_banner" className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 px-4 py-1.5 text-xs font-mono flex justify-between items-center z-10">
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
        <span>SYSTEM MODE: <strong className="text-zinc-200">Express Web-UI Mock Server Linked</strong></span>
      </div>
      <div className="flex items-center gap-5">
        <span>PORT: <span className="text-zinc-200">3000 (Proxy Active)</span></span>
        <button 
          id="refresh_data_btn"
          onClick={loadDataFromServer}
          className="text-zinc-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
          title="Refresh database state"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Sync</span>
        </button>
        <div className="flex items-center gap-1.5 bg-zinc-850 px-2 py-0.5 rounded border border-zinc-750">
          <span className="text-[10px] uppercase text-zinc-500 tracking-wider">Simulate Role:</span>
          <button
            id="role_customer_btn"
            onClick={() => { 
              setUserRole('customer'); 
              triggerToast("Switched to Customer Context"); 
              if (activeTab === 'admin') setActiveTab('shop'); 
            }}
            className={`px-1.5 py-0.5 text-[10px] rounded font-semibold whitespace-nowrap transition-colors ${userRole === 'customer' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:bg-zinc-800'}`}
          >
            Customer
          </button>
          <button
            id="role_admin_btn"
            onClick={() => { 
              setUserRole('admin'); 
              triggerToast("Switched to Developer Admin Context"); 
            }}
            className={`px-1.5 py-0.5 text-[10px] rounded font-semibold whitespace-nowrap transition-colors ${userRole === 'admin' ? 'bg-indigo-600 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-800'}`}
          >
            Merchant
          </button>
        </div>
      </div>
    </div>
  );
}
