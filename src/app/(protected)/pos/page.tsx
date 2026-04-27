'use client';
import { useStore, InventoryItem } from '@/store/useStore';
import { useState } from 'react';
import { Search, ArrowLeft, User, CheckCircle2, Minus, Plus, Receipt } from 'lucide-react';
import Link from 'next/link';
import ReceiptModal, { ReceiptData } from '@/components/ReceiptModal';

type CartItem = InventoryItem & { cartQuantity: number };

export default function PosPage() {
  const { inventoryByOwner, activeUserId, addPosTransaction, partners } = useStore();
  const inventory = inventoryByOwner[activeUserId] || [];
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkoutComplete, setCheckoutComplete] = useState(false);
  const [lastSale, setLastSale] = useState<CartItem[] | null>(null);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  const filteredItems = inventory.filter(i => 
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    i.id.includes(searchTerm)
  );

  const addToCart = (item: InventoryItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        if (existing.cartQuantity >= item.currentStock) return prev;
        return prev.map(i => i.id === item.id ? { ...i, cartQuantity: i.cartQuantity + 1 } : i);
      }
      if (item.currentStock === 0) return prev;
      return [...prev, { ...item, cartQuantity: 1 }];
    });
  };

  const decreaseQuantity = (id: string) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, cartQuantity: i.cartQuantity - 1 } : i).filter(i => i.cartQuantity > 0));
  };

  const total = cart.reduce((acc, curr) => acc + (curr.price * curr.cartQuantity), 0);
  const totalItems = cart.reduce((acc, curr) => acc + curr.cartQuantity, 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    
    // Save cart for receipt before clearing
    setLastSale([...cart]);
    
    cart.forEach(item => {
      addPosTransaction(item.id, item.cartQuantity);
    });
    
    setCart([]);
    setCheckoutComplete(true);
    setTimeout(() => setCheckoutComplete(false), 10000); // Longer timeout for receipt access
  };

  const handleGenerateReceipt = () => {
    if (!lastSale) return;
    const orgName = partners.find(p => p.id === activeUserId)?.name ?? 'Store';
    
    const receipt: ReceiptData = {
      id: 'pos_' + Date.now().toString(36),
      date: new Date().toLocaleString(),
      orgName,
      type: 'POS_SALE',
      items: lastSale.map(item => ({
        name: item.name,
        quantity: item.cartQuantity,
        unitPrice: item.price,
        lineTotal: item.price * item.cartQuantity,
      })),
      total: lastSale.reduce((acc, item) => acc + (item.price * item.cartQuantity), 0),
    };
    
    setReceiptData(receipt);
  };

  return (
    <div className="flex flex-col h-full bg-beige">
      {/* POS Header */}
      <div className="flex items-center justify-between mb-8 bg-white p-4 rounded-3xl shadow-sm">
        <Link href="/dashboard" className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-2xl hover:bg-gray-200 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div className="text-center">
          <h1 className="text-xl font-sans font-bold text-[#1F2937]">New Transaction</h1>
          <div className="text-xs text-gray-400 font-sans tracking-widest uppercase mt-1">LUMINA POS SYSTEM</div>
        </div>
        <Link href="/settings" className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-2xl hover:bg-gray-200 transition-colors">
          <User className="w-5 h-5 text-gray-600" />
        </Link>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6 items-start flex-1 overflow-hidden">
        {/* Product Catalog */}
        <div className="flex-1 w-full flex flex-col gap-6 overflow-y-auto pr-2 pb-8">
          <div className="relative">
            <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search products..." 
              className="w-full bg-white border border-gray-100 rounded-3xl pl-14 pr-6 py-4 font-sans shadow-sm outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-gray-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredItems.map(item => (
              <button 
                key={item.id} 
                onClick={() => addToCart(item)}
                disabled={item.currentStock === 0}
                className="bg-white p-6 rounded-[1.5rem] flex flex-col text-left hover:shadow-md transition-shadow disabled:opacity-50 border border-transparent hover:border-gray-100 relative"
              >
                <div className="font-sans font-bold text-[#1F2937] mb-6">{item.name}</div>
                <div className="mt-auto flex justify-between w-full items-end">
                  <div className="text-xl font-bold font-sans text-[#10B981]">${item.price.toFixed(2)}</div>
                  <div className="text-xs font-sans text-gray-400">{item.currentStock} in stock</div>
                </div>
              </button>
            ))}
          </div>
        </div>
        
        {/* Cart Sidebar */}
        <div className="w-full lg:w-[400px] bg-white rounded-[2rem] flex flex-col min-h-[600px] shadow-sm p-6 shrink-0 border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-sans font-bold text-[#1F2937]">Current Order</h2>
            <div className="bg-[#D1FAE5] text-[#059669] text-xs font-bold px-3 py-1 rounded-full">
              {totalItems} Items
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto flex flex-col gap-4 -mx-2 px-2">
            {cart.length === 0 && (
              <div className="font-sans text-center text-gray-400 py-12 flex flex-col items-center">
                <div className="text-sm">Scan or search items to add</div>
              </div>
            )}
            
            {cart.map(item => (
              <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                <div>
                  <div className="font-sans font-medium text-sm text-[#1F2937]">{item.name}</div>
                  <div className="font-sans text-xs text-gray-400 mt-1">${item.price.toFixed(2)} &times; {item.cartQuantity}</div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => decreaseQuantity(item.id)} className="w-8 h-8 flex items-center justify-center font-bold text-gray-500 hover:bg-gray-100 rounded-full transition-colors" aria-label={`Decrease ${item.name}`}>
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-sans font-bold text-sm w-4 text-center">{item.cartQuantity}</span>
                  <button onClick={() => addToCart(item)} className="w-8 h-8 flex items-center justify-center font-bold text-gray-500 hover:bg-gray-100 rounded-full transition-colors" aria-label={`Increase ${item.name}`}>
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-6 border-t border-gray-100">
            <div className="flex justify-between items-end mb-6">
              <div className="font-sans font-bold text-lg text-[#1F2937]">Total</div>
              <div className="font-sans text-2xl font-bold text-[#1F2937]">${total.toFixed(2)}</div>
            </div>
            
            {checkoutComplete ? (
              <div className="flex flex-col gap-3">
                <div className="bg-[#10B981] text-white text-center py-4 rounded-full font-sans font-bold shadow-lg shadow-green-500/20 flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Completed
                </div>
                <button
                  onClick={handleGenerateReceipt}
                  className="bg-[#111] hover:bg-black text-white w-full py-3.5 text-sm rounded-full font-sans font-bold shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <Receipt className="w-4 h-4" />
                  Generate Receipt
                </button>
              </div>
            ) : (
              <button 
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="bg-[#10B981] hover:bg-[#059669] disabled:bg-gray-200 disabled:text-gray-400 text-white w-full py-4 text-lg rounded-full font-sans font-bold shadow-lg shadow-green-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                Complete Checkout
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      {receiptData && (
        <ReceiptModal
          receipt={receiptData}
          onClose={() => setReceiptData(null)}
        />
      )}
    </div>
  );
}
