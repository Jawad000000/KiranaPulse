'use client';
import { useStore, Order } from '@/store/useStore';
import { useState } from 'react';
import { CheckCircle, Clock, XCircle, Package, Printer, FileDown, BookOpen } from 'lucide-react';
import ReceiptModal, { ReceiptData } from '@/components/ReceiptModal';
import LogbookGenerator from '@/components/LogbookGenerator';
import { generateSingleOrderLog } from '@/lib/generateDocx';

export default function OrdersPage() {
  const { orders, inventoryByOwner, activeUserId, userRole, fulfillOrder, partners } = useStore();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [logbookOpen, setLogbookOpen] = useState(false);

  const inventory = inventoryByOwner[activeUserId] || [];
  
  const incomingOrders = orders.filter(o => o.targetId === activeUserId);
  const outgoingOrders = orders.filter(o => o.requesterId === activeUserId);

  // Determine which list to show based on role
  // Distributor sees incoming by default, but we can show both.
  const displayOrders = userRole === 'Retailer' ? outgoingOrders : incomingOrders;
  const secondaryOrders = userRole === 'Distributor' ? outgoingOrders : [];

  // All orders relevant to this user (for logbook)
  const allMyOrders = orders.filter(o => o.requesterId === activeUserId || o.targetId === activeUserId);

  const selectedOrder = orders.find(o => o.id === selectedOrderId);
  const orgName = partners.find(p => p.id === activeUserId)?.name ?? 'Organization';
  
  const handleFulfill = (id: string) => {
    const result = fulfillOrder(id);
    alert(result.message);
    if (result.ok) {
      setSelectedOrderId(null);
    }
  };

  const handlePrintReceipt = (order: Order) => {
    const item = inventory.find(i => i.id === order.itemId);
    const partnerId = order.requesterId === activeUserId ? order.targetId : order.requesterId;
    const partnerName = partners.find(p => p.id === partnerId)?.name ?? partnerId;

    const receipt: ReceiptData = {
      id: order.id,
      date: new Date(order.timestamp).toLocaleString(),
      orgName,
      partnerName,
      type: 'ORDER_FULFILLMENT',
      items: [{
        name: item?.name ?? 'Unknown Item',
        quantity: order.quantity,
        unitPrice: item?.price ?? 0,
        lineTotal: (item?.price ?? 0) * order.quantity,
      }],
      total: (item?.price ?? 0) * order.quantity,
    };

    setReceiptData(receipt);
  };

  const handleDownloadLog = async (order: Order) => {
    await generateSingleOrderLog(order, inventory, partners, orgName);
  };

  const renderOrderList = (orderList: Order[], title: string, isIncoming: boolean) => (
    <div className="flex flex-col gap-4">
      <h2 className="font-sans font-bold text-xl text-dark mb-2">{title}</h2>
      {orderList.length === 0 && (
        <div className="card-soft text-center py-8 text-gray-400 font-sans text-sm">
          No orders found.
        </div>
      )}
      <div className="flex flex-col gap-3">
        {orderList.map(order => {
          const item = inventory.find(i => i.id === order.itemId);
          const partnerId = isIncoming ? order.requesterId : order.targetId;
          const partner = partners.find(p => p.id === partnerId);
          const isSelected = selectedOrderId === order.id;
          
          return (
            <button
              key={order.id}
              onClick={() => setSelectedOrderId(order.id)}
              className={`text-left card-soft p-4 transition-all border ${isSelected ? 'border-dark shadow-md' : 'border-transparent hover:border-gray-200'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="font-sans font-bold text-dark">{item?.name || 'Unknown Item'}</div>
                {order.status === 'pending' && <Clock className="w-4 h-4 text-orange-500" />}
                {order.status === 'fulfilled' && <CheckCircle className="w-4 h-4 text-green-500" />}
                {order.status === 'cancelled' && <XCircle className="w-4 h-4 text-red-500" />}
              </div>
              <div className="flex justify-between items-end">
                <div className="font-sans text-xs text-gray-500 flex flex-col gap-1">
                  <span>{isIncoming ? 'From: ' : 'To: '}<strong className="text-gray-700">{partner?.name || partnerId}</strong></span>
                  <span>QTY: <strong className="text-gray-700">{order.quantity}</strong></span>
                </div>
                <div className="badge-soft text-[10px] uppercase bg-gray-50 text-gray-500 border border-gray-200">
                  {order.status}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-8 h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-3xl font-sans font-bold text-dark">
            {userRole === 'Retailer' ? 'Orders Registry' : 'Orders Received'}
          </h1>
          <div className="font-sans text-sm text-gray-500 mt-1">Manage upstream and downstream fulfillment</div>
        </div>
        <button
          onClick={() => setLogbookOpen(true)}
          className="flex items-center gap-2 bg-[#111] hover:bg-black text-white px-5 py-2.5 rounded-2xl font-sans font-bold text-sm transition-colors shadow-md"
        >
          <BookOpen className="w-4 h-4" />
          Generate Logbook
        </button>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Panel: Order Lists */}
        <div className="w-full lg:w-1/3 flex flex-col gap-8">
          {renderOrderList(displayOrders, userRole === 'Retailer' ? 'My Requests' : 'Incoming Orders', userRole !== 'Retailer')}
          
          {secondaryOrders.length > 0 && (
            renderOrderList(secondaryOrders, 'My Outgoing Requests', false)
          )}
        </div>

        {/* Right Panel: Detail View */}
        <div className="w-full lg:w-2/3 sticky top-6">
          {selectedOrder ? (
            <div className="card-soft p-8 flex flex-col gap-6 border border-gray-200 shadow-sm">
              <div className="flex justify-between items-start border-b border-gray-100 pb-6">
                <div>
                  <div className="font-mono text-sm text-gray-400 mb-2">Order ID: {selectedOrder.id}</div>
                  <h2 className="text-2xl font-sans font-bold text-dark">
                    {inventory.find(i => i.id === selectedOrder.itemId)?.name || 'Unknown Item'}
                  </h2>
                </div>
                <div className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider border
                  ${selectedOrder.status === 'pending' ? 'bg-orange-50 text-orange-600 border-orange-200' : 
                    selectedOrder.status === 'fulfilled' ? 'bg-green-50 text-green-600 border-green-200' : 
                    'bg-red-50 text-red-600 border-red-200'}
                `}>
                  {selectedOrder.status}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6 pb-6 border-b border-gray-100">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-sans text-gray-400 uppercase tracking-wider">Requester</span>
                  <span className="font-sans font-bold text-dark">
                    {partners.find(p => p.id === selectedOrder.requesterId)?.name || selectedOrder.requesterId}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-sans text-gray-400 uppercase tracking-wider">Target Provider</span>
                  <span className="font-sans font-bold text-dark">
                    {partners.find(p => p.id === selectedOrder.targetId)?.name || selectedOrder.targetId}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-sans text-gray-400 uppercase tracking-wider">Quantity Requested</span>
                  <span className="font-sans font-bold text-xl text-dark">{selectedOrder.quantity} Units</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-sans text-gray-400 uppercase tracking-wider">Timestamp</span>
                  <span className="font-sans text-sm text-gray-600">
                    {new Date(selectedOrder.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Action Area */}
              <div className="pt-2">
                {selectedOrder.targetId === activeUserId && selectedOrder.status === 'pending' ? (
                  <div className="flex flex-col gap-4">
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-start gap-3">
                      <Package className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <div className="text-sm font-sans font-bold text-dark">Fulfillment Check</div>
                        <div className="text-sm font-sans text-gray-500 mt-1">
                          You have {inventory.find(i => i.id === selectedOrder.itemId)?.currentStock || 0} units available in your inventory.
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleFulfill(selectedOrder.id)}
                      className="w-full bg-[#10B981] hover:bg-[#059669] text-white font-sans font-bold py-4 rounded-2xl shadow-md transition-colors flex justify-center items-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Complete Checkout
                    </button>
                  </div>
                ) : selectedOrder.requesterId === activeUserId && selectedOrder.status === 'pending' ? (
                  <div className="text-center font-sans text-gray-500 italic py-4">
                    Waiting for {partners.find(p => p.id === selectedOrder.targetId)?.name} to fulfill this order...
                  </div>
                ) : selectedOrder.status === 'fulfilled' ? (
                  <div className="flex flex-col gap-4">
                    <div className="text-center font-sans text-green-600 font-bold bg-green-50 py-4 rounded-xl border border-green-100">
                      This order has been successfully fulfilled.
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handlePrintReceipt(selectedOrder)}
                        className="flex-1 bg-[#111] hover:bg-black text-white font-sans font-bold py-3.5 rounded-2xl shadow-md transition-colors flex justify-center items-center gap-2"
                      >
                        <Printer className="w-4 h-4" />
                        Print Receipt
                      </button>
                      <button
                        onClick={() => handleDownloadLog(selectedOrder)}
                        className="flex-1 bg-white hover:bg-gray-50 text-dark font-sans font-bold py-3.5 rounded-2xl shadow-md transition-colors flex justify-center items-center gap-2 border border-gray-200"
                      >
                        <FileDown className="w-4 h-4" />
                        Download Log
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="card-soft flex flex-col items-center justify-center text-center py-24 h-full border border-dashed border-gray-200">
              <Package className="w-12 h-12 text-gray-200 mb-4" />
              <h3 className="font-sans font-bold text-xl text-gray-400">No Order Selected</h3>
              <p className="font-sans text-sm text-gray-400 mt-2 max-w-xs">Select an order from the list to view its details and manage fulfillment.</p>
            </div>
          )}
        </div>
      </div>

      {/* Receipt Modal */}
      {receiptData && (
        <ReceiptModal
          receipt={receiptData}
          onClose={() => setReceiptData(null)}
        />
      )}

      {/* Logbook Generator Drawer */}
      <LogbookGenerator
        isOpen={logbookOpen}
        onClose={() => setLogbookOpen(false)}
        orders={allMyOrders}
        inventory={inventory}
        partners={partners}
        orgName={orgName}
      />
    </div>
  );
}
