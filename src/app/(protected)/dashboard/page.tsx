'use client';
import { useStore } from '@/store/useStore';
import Link from 'next/link';
import { useState } from 'react';

export default function DashboardPage() {
  const { inventoryByOwner, userRole, activeUserId, partners, subscriptions } = useStore();
  const inventory = inventoryByOwner[activeUserId] || [];
  const [activeCategory, setActiveCategory] = useState('All');
  
  const categories = ['All', 'Electronics', 'Clothing', 'Groceries', 'Home'];

  // Filter inventory based on active category
  const filteredInventory = activeCategory === 'All' 
    ? inventory 
    : inventory.filter(i => i.category === activeCategory);

  // Compute subscribers based on role
  // Manufacturer sees Distributors who target them
  // Distributor sees Retailers who target them
  const mySubscribers = subscriptions
    .filter(s => s.targetId === activeUserId)
    .map(s => partners.find(p => p.id === s.subscriberId))
    .filter(Boolean) as typeof partners;

  const subscriberLabel = userRole === 'Manufacturer' ? 'My Subscribed Distributors' : 'My Subscribed Retailers';

  return (
    <div className="flex flex-col gap-10">
      <div className="flex gap-4 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button 
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-6 py-2 rounded-full font-sans font-bold text-sm whitespace-nowrap transition-all ${
              activeCategory === cat 
                ? 'bg-green-500 text-white shadow-md shadow-green-500/20' 
                : 'bg-white text-gray-600 border border-black/5 shadow-sm hover:border-black/20'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredInventory.map(item => {
          const isLowStock = (item.currentStock / item.maxStock) < 0.3;
          const sold = item.maxStock - item.currentStock;
          const total = item.maxStock;
          const availablePercent = Math.round((item.currentStock / total) * 100);
          
          return (
            <div key={item.id} className="card-soft flex flex-col items-center text-center p-8">
              <div className="relative w-24 h-24 mb-6">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-signal-red"
                    strokeDasharray="100, 100"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="text-green-500 transition-all duration-1000"
                    strokeDasharray={`${availablePercent}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center font-sans font-bold text-sm">
                  {availablePercent}%
                </div>
              </div>

              <h3 className="font-sans font-bold text-lg text-dark">{item.name}</h3>
              <p className="text-sm text-gray-500 mb-6">{item.category}</p>

              <div className="flex justify-between w-full max-w-[200px] mb-6">
                <div className="flex flex-col items-center">
                  <span className="text-xs font-bold text-green-500 mb-1">Available</span>
                  <span className="font-bold text-xl">{item.currentStock}</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-xs font-bold text-signal-red mb-1">Sold</span>
                  <span className="font-bold text-xl">{sold}</span>
                </div>
              </div>

              {isLowStock && (
                <div className="bg-red-50 text-signal-red text-xs font-bold px-4 py-2 rounded-full border border-red-100 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-signal-red"></span>
                  LOW STOCK
                </div>
              )}
            </div>
          );
        })}
        {filteredInventory.length === 0 && (
          <div className="col-span-full font-sans text-center text-gray-500 py-12 card-soft">
            No items found in this category.
          </div>
        )}
      </div>
      
      {/* Replenishment Banner */}
      <div className="bg-[#1B4332] text-white rounded-[2rem] p-8 flex flex-col md:flex-row justify-between items-center shadow-xl mt-8">
        <div>
          <h2 className="text-3xl font-sans font-bold mb-2">Replenishment Status</h2>
          <p className="text-[#A7C957]">
            {inventory.filter(i => (i.currentStock / i.maxStock) < 0.3).length} items are currently below safety threshold.
          </p>
        </div>
        <Link href="/inventory" className="mt-6 md:mt-0 bg-[#40916C] hover:bg-[#52B788] text-white font-sans font-bold py-3 px-8 rounded-full transition-colors">
          Manage Restock
        </Link>
      </div>

      {/* Network Overview (Subscribers) */}
      {(userRole === 'Manufacturer' || userRole === 'Distributor') && (
        <div className="mt-8">
          <h2 className="text-2xl font-sans font-bold text-dark mb-6">{subscriberLabel}</h2>
          {mySubscribers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mySubscribers.map(sub => (
                <div key={sub.id} className="card-soft flex items-center justify-between">
                  <div>
                    <div className="font-sans font-bold text-dark text-lg">{sub.name}</div>
                    <div className="font-mono text-xs text-gray-400 mt-1">ID: {sub.id}</div>
                  </div>
                  <span className="badge-soft bg-blue-50 text-blue-600 border border-blue-100">
                    SUBSCRIBED
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="card-soft font-sans text-center text-gray-500 py-12">
              No partners have subscribed to your inventory yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
