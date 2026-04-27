'use client';
import { useState } from 'react';
import { X, FileDown, Hash, CalendarDays, Loader2 } from 'lucide-react';
import MiniCalendar from '@/components/MiniCalendar';
import { generateLogbook } from '@/lib/generateDocx';
import type { Order, InventoryItem, Partner } from '@/store/useStore';

type FilterMode = 'count' | 'dateRange';

type LogbookGeneratorProps = {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  inventory: InventoryItem[];
  partners: Partner[];
  orgName: string;
};

export default function LogbookGenerator({
  isOpen,
  onClose,
  orders,
  inventory,
  partners,
  orgName,
}: LogbookGeneratorProps) {
  const [mode, setMode] = useState<FilterMode>('count');
  const [orderCount, setOrderCount] = useState('10');
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  // Only fulfilled orders, sorted newest first
  const fulfilledOrders = orders
    .filter((o) => o.status === 'fulfilled')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const getFilteredOrders = (): Order[] => {
    if (mode === 'count') {
      const n = parseInt(orderCount, 10);
      if (isNaN(n) || n <= 0) return [];
      return fulfilledOrders.slice(0, n);
    } else {
      if (!fromDate || !toDate) return [];
      const from = new Date(fromDate);
      from.setHours(0, 0, 0, 0);
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      return fulfilledOrders.filter((o) => {
        const t = new Date(o.timestamp).getTime();
        return t >= from.getTime() && t <= to.getTime();
      });
    }
  };

  const filteredOrders = getFilteredOrders();

  const getFilterLabel = (): string => {
    if (mode === 'count') {
      return `Last ${filteredOrders.length} Fulfilled Order${filteredOrders.length !== 1 ? 's' : ''}`;
    }
    if (fromDate && toDate) {
      return `${fromDate.toLocaleDateString()} — ${toDate.toLocaleDateString()}`;
    }
    return 'Date range not selected';
  };

  const handleGenerate = async () => {
    if (filteredOrders.length === 0) return;
    setIsGenerating(true);
    try {
      await generateLogbook(filteredOrders, inventory, partners, orgName, getFilterLabel());
    } catch (err) {
      console.error('Logbook generation failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const canGenerate = filteredOrders.length > 0 && !isGenerating;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#111] rounded-xl flex items-center justify-center">
              <FileDown className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-sans font-bold text-dark text-sm">Generate Logbook</div>
              <div className="font-mono text-[10px] text-gray-400 uppercase tracking-widest">
                DOCX Export
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          {/* Stats */}
          <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="font-mono text-[10px] text-gray-400 uppercase tracking-wider">
                Fulfilled Orders
              </div>
              <div className="font-sans font-bold text-2xl text-dark">
                {fulfilledOrders.length}
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-[10px] text-gray-400 uppercase tracking-wider">
                Selected
              </div>
              <div className="font-sans font-bold text-2xl text-[#10B981]">
                {filteredOrders.length}
              </div>
            </div>
          </div>

          {/* Mode Selector */}
          <div className="flex rounded-2xl bg-gray-50 p-1 gap-1">
            <button
              onClick={() => setMode('count')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-sans font-bold text-sm transition-all ${
                mode === 'count'
                  ? 'bg-white shadow-sm text-dark'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Hash className="w-4 h-4" />
              Last N Orders
            </button>
            <button
              onClick={() => setMode('dateRange')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-sans font-bold text-sm transition-all ${
                mode === 'dateRange'
                  ? 'bg-white shadow-sm text-dark'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              Date Range
            </button>
          </div>

          {/* Filter Inputs */}
          {mode === 'count' ? (
            <div className="flex flex-col gap-2">
              <label className="font-sans font-bold text-sm text-gray-600">
                Number of Orders
              </label>
              <input
                type="number"
                min={1}
                max={fulfilledOrders.length}
                value={orderCount}
                onChange={(e) => setOrderCount(e.target.value)}
                placeholder={`Max: ${fulfilledOrders.length}`}
                className="input-soft font-mono"
              />
              <div className="text-xs font-sans text-gray-400">
                Will export the most recent {Math.min(parseInt(orderCount) || 0, fulfilledOrders.length)} fulfilled orders
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* From Date */}
              <div className="flex flex-col gap-2">
                <label className="font-sans font-bold text-sm text-gray-600 flex items-center justify-between">
                  <span>From Date</span>
                  {fromDate && (
                    <span className="font-mono text-xs text-[#10B981] font-normal">
                      {fromDate.toLocaleDateString()}
                    </span>
                  )}
                </label>
                <MiniCalendar
                  selected={fromDate}
                  onSelect={setFromDate}
                  maxDate={toDate ?? new Date()}
                />
              </div>

              {/* To Date */}
              <div className="flex flex-col gap-2">
                <label className="font-sans font-bold text-sm text-gray-600 flex items-center justify-between">
                  <span>To Date</span>
                  {toDate && (
                    <span className="font-mono text-xs text-[#10B981] font-normal">
                      {toDate.toLocaleDateString()}
                    </span>
                  )}
                </label>
                <MiniCalendar
                  selected={toDate}
                  onSelect={setToDate}
                  minDate={fromDate ?? undefined}
                  maxDate={new Date()}
                />
              </div>

              {fromDate && toDate && (
                <div className="text-xs font-sans text-gray-400">
                  Found {filteredOrders.length} fulfilled order{filteredOrders.length !== 1 ? 's' : ''} in this range
                </div>
              )}
            </div>
          )}

          {/* Preview */}
          {filteredOrders.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4 flex flex-col gap-2">
              <div className="font-sans font-bold text-xs text-gray-400 uppercase tracking-wider">
                Preview
              </div>
              <div className="flex flex-col gap-1.5 max-h-[150px] overflow-y-auto">
                {filteredOrders.slice(0, 8).map((order) => {
                  const item = inventory.find((i) => i.id === order.itemId);
                  return (
                    <div
                      key={order.id}
                      className="flex items-center justify-between text-xs font-sans"
                    >
                      <span className="text-gray-700 font-medium truncate max-w-[180px]">
                        {item?.name ?? 'Unknown'}
                      </span>
                      <span className="text-gray-400 font-mono">
                        {order.quantity} × ${(item?.price ?? 0).toFixed(2)}
                      </span>
                    </div>
                  );
                })}
                {filteredOrders.length > 8 && (
                  <div className="text-[10px] text-gray-400 text-center pt-1">
                    +{filteredOrders.length - 8} more orders
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 shrink-0">
          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="w-full bg-[#111] hover:bg-black disabled:bg-gray-100 disabled:text-gray-400 text-white font-sans font-bold py-4 rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-md disabled:shadow-none"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4" />
                Download Logbook (.docx)
              </>
            )}
          </button>
          {filteredOrders.length === 0 && (
            <div className="text-center text-xs font-sans text-gray-400 mt-3">
              {mode === 'count'
                ? 'Enter a valid number of orders'
                : 'Select both dates to find orders'}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
