'use client';
import { useState } from 'react';
import { X, Package, Hash, Percent } from 'lucide-react';
import { InventoryItem } from '@/store/useStore';

type DrawerMode = 'units' | 'percentage';

type RestockDrawerProps = {
  item: InventoryItem | null;
  isManufacturer: boolean;
  onClose: () => void;
  onSubmit: (itemId: string, quantity: number) => void;
};

export default function RestockDrawer({ item, isManufacturer, onClose, onSubmit }: RestockDrawerProps) {
  const [mode, setMode] = useState<DrawerMode>('units');
  const [unitInput, setUnitInput] = useState('');
  const [percentInput, setPercentInput] = useState('30');

  // Reset inputs when item changes by using the component's internal initial state.
  // The parent passes `key={item.id}` to force a fresh mount per item.

  if (!item) return null;

  const available = item.maxStock - item.currentStock;

  const computedUnits = (() => {
    if (mode === 'units') {
      const n = parseInt(unitInput, 10);
      return isNaN(n) || n <= 0 ? 0 : Math.min(n, available);
    } else {
      const p = parseFloat(percentInput);
      return isNaN(p) || p <= 0 ? 0 : Math.min(Math.ceil(item.currentStock * (p / 100)), available);
    }
  })();

  const resultingStock = item.currentStock + computedUnits;
  const isAtMax = item.currentStock >= item.maxStock;
  const canSubmit = computedUnits > 0 && !isAtMax;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit(item.id, computedUnits);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-white z-50 shadow-2xl flex flex-col transition-transform">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center">
              <Package className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <div className="font-sans font-bold text-dark text-sm">{item.name}</div>
              <div className="font-mono text-xs text-gray-400 mt-0.5">
                {item.currentStock} / {item.maxStock} units
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          <div>
            <h2 className="font-sans font-bold text-xl text-dark">
              {isManufacturer ? 'Update Stock' : 'Request Restock'}
            </h2>
            <p className="font-sans text-sm text-gray-500 mt-1">
              {isManufacturer
                ? 'Directly increase your inventory for this item.'
                : 'Create a pending order for your subscribed upstream partner.'}
            </p>
          </div>

          {/* Mode Selector */}
          <div className="flex rounded-2xl bg-gray-50 p-1 gap-1">
            <button
              onClick={() => setMode('units')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl font-sans font-bold text-sm transition-all ${
                mode === 'units' ? 'bg-white shadow-sm text-dark' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Hash className="w-4 h-4" />
              Units
            </button>
            <button
              onClick={() => setMode('percentage')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl font-sans font-bold text-sm transition-all ${
                mode === 'percentage' ? 'bg-white shadow-sm text-dark' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Percent className="w-4 h-4" />
              Percentage
            </button>
          </div>

          {/* Input */}
          {mode === 'units' ? (
            <div className="flex flex-col gap-2">
              <label className="font-sans font-bold text-sm text-gray-600">Number of Units</label>
              <input
                type="number"
                min={1}
                max={available}
                value={unitInput}
                onChange={e => setUnitInput(e.target.value)}
                placeholder={`Max available: ${available}`}
                className="input-soft font-mono"
              />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <label className="font-sans font-bold text-sm text-gray-600">Percentage of Current Stock</label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={percentInput}
                  onChange={e => setPercentInput(e.target.value)}
                  placeholder="e.g. 30"
                  className="input-soft font-mono pr-10 w-full"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
              </div>
              <div className="text-xs font-sans text-gray-400 mt-1">
                Based on current stock of {item.currentStock} units
              </div>
            </div>
          )}

          {/* Preview Card */}
          <div className="bg-gray-50 rounded-2xl p-4 flex flex-col gap-3">
            <div className="font-sans font-bold text-sm text-gray-500 uppercase tracking-wider">Preview</div>
            <div className="flex justify-between items-center">
              <span className="font-sans text-sm text-gray-500">Units Requested</span>
              <span className={`font-mono font-bold text-lg ${computedUnits > 0 ? 'text-dark' : 'text-gray-300'}`}>
                {computedUnits > 0 ? `+${computedUnits}` : '—'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-sans text-sm text-gray-500">
                {isManufacturer ? 'Resulting Stock' : 'Stock After Fulfillment'}
              </span>
              <span className={`font-mono font-bold text-lg ${computedUnits > 0 ? 'text-green-600' : 'text-gray-300'}`}>
                {computedUnits > 0 ? resultingStock : '—'} / {item.maxStock}
              </span>
            </div>
            {isAtMax && (
              <div className="text-xs font-sans text-orange-500 font-medium mt-1">
                Item is already at maximum stock.
              </div>
            )}
            {available === 0 && !isAtMax && (
              <div className="text-xs font-sans text-orange-500 font-medium mt-1">
                No capacity left.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full bg-[#151515] hover:bg-black disabled:bg-gray-100 disabled:text-gray-400 text-white font-sans font-bold py-4 rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-md disabled:shadow-none"
          >
            {isManufacturer ? 'Update Stock' : 'Submit Restock Order'}
          </button>
          <button
            onClick={onClose}
            className="w-full mt-3 text-sm font-sans font-bold text-gray-400 hover:text-gray-600 transition-colors py-2"
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}
