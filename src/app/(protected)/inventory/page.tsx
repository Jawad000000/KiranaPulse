'use client';
import { useStore, InventoryItem } from '@/store/useStore';
import { useState } from 'react';
import RestockDrawer from '@/components/RestockDrawer';

export default function InventoryPage() {
  const { inventoryByOwner, activeUserId, userRole, replenishStock, updateManufacturerStock } = useStore();
  const inventory = inventoryByOwner[activeUserId] || [];
  const [filter, setFilter] = useState('ALL');
  const [drawerItem, setDrawerItem] = useState<InventoryItem | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const categories = ['ALL', ...Array.from(new Set(inventory.map(i => i.category.toUpperCase())))];
  const filteredInventory = inventory.filter(i => filter === 'ALL' || i.category.toUpperCase() === filter);

  const isManufacturer = userRole === 'Manufacturer';

  const handleDrawerSubmit = (itemId: string, quantity: number) => {
    if (isManufacturer) {
      updateManufacturerStock(itemId, quantity);
      setFeedbackMsg({ ok: true, text: 'Stock updated successfully.' });
    } else {
      const result = replenishStock(itemId, quantity);
      setFeedbackMsg({ ok: result.ok, text: result.message });
    }
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Feedback Toast */}
      {feedbackMsg && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full font-sans font-bold text-sm shadow-lg transition-all flex items-center gap-2 ${
          feedbackMsg.ok
            ? 'bg-green-500 text-white'
            : 'bg-[#151515] text-white'
        }`}>
          {feedbackMsg.ok ? '✓' : '✕'} {feedbackMsg.text}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-end pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-sans font-bold text-dark">Inventory Registry</h1>
          <div className="font-sans text-sm text-gray-500 mt-1">Real-time stock status</div>
        </div>
        <div className="flex gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`font-sans font-bold text-sm px-4 py-2 rounded-full transition-all ${filter === cat ? 'bg-dark text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card-soft p-0 overflow-hidden">
        <table className="w-full text-left font-sans">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider border-b border-gray-100">
            <tr>
              <th className="p-6 font-bold">SKU / Item</th>
              <th className="p-6 font-bold">Category</th>
              <th className="p-6 text-right font-bold">Price</th>
              <th className="p-6 text-right font-bold">Stock</th>
              <th className="p-6 text-center font-bold">Status</th>
              <th className="p-6 text-right font-bold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredInventory.map(item => {
              const ratio = item.currentStock / item.maxStock;
              const isLow = ratio < 0.3;
              const isAtMax = item.currentStock >= item.maxStock;

              return (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-6">
                    <div className="font-mono text-xs text-gray-400 mb-1">{item.id}</div>
                    <div className="font-bold text-dark text-lg">{item.name}</div>
                  </td>
                  <td className="p-6 uppercase text-sm text-gray-600 font-medium">{item.category}</td>
                  <td className="p-6 text-right font-mono font-medium text-gray-600">${item.price.toFixed(2)}</td>
                  <td className="p-6 text-right">
                    <div className="text-xl font-bold text-dark">{item.currentStock}</div>
                    <div className="text-xs font-mono text-gray-400">MAX: {item.maxStock}</div>
                  </td>
                  <td className="p-6 text-center">
                    {isLow ? (
                      <span className="badge-soft bg-red-50 text-signal-red border border-red-100">LOW STOCK</span>
                    ) : (
                      <span className="badge-soft bg-green-50 text-green-600 border border-green-100">OPTIMAL</span>
                    )}
                  </td>
                  <td className="p-6 text-right">
                    <button
                      onClick={() => setDrawerItem(item)}
                      disabled={isAtMax}
                      className={`font-sans font-bold text-sm px-4 py-2 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                        isManufacturer
                          ? 'bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 disabled:hover:bg-blue-50'
                          : 'bg-green-50 hover:bg-green-100 text-green-600 border border-green-200 disabled:hover:bg-green-50'
                      }`}
                    >
                      {isManufacturer ? 'Update Stock' : 'Restock'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Restock Drawer */}
      <RestockDrawer
        key={drawerItem?.id ?? 'none'}
        item={drawerItem}
        isManufacturer={isManufacturer}
        onClose={() => setDrawerItem(null)}
        onSubmit={handleDrawerSubmit}
      />
    </div>
  );
}
