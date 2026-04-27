'use client';
import { X, Printer } from 'lucide-react';

export type ReceiptItem = {
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type ReceiptData = {
  id: string;
  date: string;
  orgName: string;
  partnerName?: string;
  type: 'POS_SALE' | 'ORDER_FULFILLMENT';
  items: ReceiptItem[];
  total: number;
};

type ReceiptModalProps = {
  receipt: ReceiptData;
  onClose: () => void;
};

export default function ReceiptModal({ receipt, onClose }: ReceiptModalProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 print:hidden"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:p-0 print:static print:inset-auto">
        {/* Action Buttons (hidden in print) */}
        <div className="absolute top-6 right-6 flex items-center gap-3 print:hidden">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-dark text-white px-5 py-2.5 rounded-full font-sans font-bold text-sm hover:bg-black transition-colors shadow-lg"
          >
            <Printer className="w-4 h-4" />
            Print Receipt
          </button>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Paper */}
        <div
          id="receipt-printable"
          className="bg-white w-full max-w-[320px] shadow-2xl print:shadow-none print:max-w-none print:w-[80mm] font-mono text-[11px] leading-relaxed text-gray-900"
          style={{ fontFamily: "'Space Mono', 'Courier New', monospace" }}
        >
          {/* Header */}
          <div className="text-center px-6 pt-8 pb-4 border-b border-dashed border-gray-300">
            <div className="text-[15px] font-bold tracking-[0.2em] uppercase mb-1">
              KiranaPulse
            </div>
            <div className="text-[9px] text-gray-500 tracking-[0.15em] uppercase">
              Supply Chain Platform
            </div>
            <div className="mt-3 text-[9px] text-gray-400">
              {receipt.type === 'POS_SALE' ? 'POINT OF SALE' : 'ORDER FULFILLMENT'}
            </div>
          </div>

          {/* Meta */}
          <div className="px-6 py-4 border-b border-dashed border-gray-300 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-gray-500">TXN</span>
              <span className="font-bold">{receipt.id.slice(0, 12).toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">DATE</span>
              <span>{receipt.date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">ORG</span>
              <span className="text-right max-w-[160px] truncate">{receipt.orgName}</span>
            </div>
            {receipt.partnerName && (
              <div className="flex justify-between">
                <span className="text-gray-500">
                  {receipt.type === 'POS_SALE' ? 'CASHIER' : 'PARTNER'}
                </span>
                <span className="text-right max-w-[160px] truncate">
                  {receipt.partnerName}
                </span>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="px-6 py-4 border-b border-dashed border-gray-300">
            {/* Column Headers */}
            <div className="flex justify-between text-[9px] text-gray-400 uppercase tracking-wider mb-2 pb-1 border-b border-gray-100">
              <span className="flex-1">Item</span>
              <span className="w-8 text-center">Qty</span>
              <span className="w-14 text-right">Price</span>
              <span className="w-16 text-right">Total</span>
            </div>

            {receipt.items.map((item, i) => (
              <div key={i} className="flex justify-between py-1.5">
                <span className="flex-1 pr-2 truncate">{item.name}</span>
                <span className="w-8 text-center text-gray-500">
                  {item.quantity}
                </span>
                <span className="w-14 text-right text-gray-500">
                  ${item.unitPrice.toFixed(2)}
                </span>
                <span className="w-16 text-right font-bold">
                  ${item.lineTotal.toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="px-6 py-4 border-b border-dashed border-gray-300">
            <div className="flex justify-between text-[9px] text-gray-400 uppercase mb-1">
              <span>Items: {receipt.items.reduce((s, i) => s + i.quantity, 0)}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-[13px] font-bold tracking-wider">TOTAL</span>
              <span className="text-[17px] font-bold">${receipt.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center px-6 pt-4 pb-8 space-y-2">
            <div className="text-[9px] text-gray-400 tracking-[0.1em] uppercase">
              Thank you for your business
            </div>
            <div className="text-[8px] text-gray-300 tracking-[0.1em]">
              Powered by KiranaPulse • kiranapulse.netlify.app
            </div>
            {/* Barcode-style decoration */}
            <div className="flex justify-center gap-[2px] pt-3">
              {Array.from({ length: 30 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-gray-800"
                  style={{
                    width: Math.random() > 0.5 ? '2px' : '1px',
                    height: `${20 + Math.random() * 10}px`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
