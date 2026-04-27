'use client';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { X, Send, Bot, User, Loader2, AlertTriangle, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { UserRole } from '@/store/useStore';

// ─── Types (mirrors route.ts RichUserContext) ─────────────────────────────────

type InventoryInsight = {
  id: string;
  name: string;
  stockPct: number;
  currentStock: number;
  maxStock: number;
  price: number;
  unitsPerDay: number;
  daysOfStockRemaining: number | null;
  urgencyScore: number;
  urgencyLabel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
};

type RevenueSnapshot = {
  last7DayRevenue: number;
  trendLabel: string;
  isPositive: boolean;
  topSellerByQty: string;
  topSellerByRevenue: string;
};

type RichUserContext = {
  role: string;
  orgName: string;
  inventoryInsights: InventoryInsight[];
  orderHealth: {
    pendingCount: number;
    fulfilledLast7Days: number;
    mostOrderedItemName: string;
  };
  revenueSnapshot: RevenueSnapshot | null;
  partnersSummary: string;
};

type Message = {
  id: string;
  role: 'user' | 'model';
  content: string;
};

type ChatBoardProps = {
  isOpen: boolean;
  onClose: () => void;
};

// ─── Analytics Engine ─────────────────────────────────────────────────────────

const VELOCITY_DAYS = 14;

function computeRichContext(
  userRole: UserRole,
  activeUserId: string,
  partners: ReturnType<typeof useStore.getState>['partners'],
  inventoryByOwner: ReturnType<typeof useStore.getState>['inventoryByOwner'],
  orders: ReturnType<typeof useStore.getState>['orders'],
  posTransactions: ReturnType<typeof useStore.getState>['posTransactions'],
  subscriptions: ReturnType<typeof useStore.getState>['subscriptions'],
): RichUserContext {
  const now = Date.now();
  const cut14 = now - VELOCITY_DAYS * 86_400_000;
  const cut7  = now - 7 * 86_400_000;
  const cut14_7 = now - 14 * 86_400_000;

  const orgName = partners.find(p => p.id === activeUserId)?.name ?? activeUserId;
  const inventory = inventoryByOwner[activeUserId] ?? [];

  // Velocity: units sold per item over last 14 days
  const recentTxns = posTransactions.filter(t => new Date(t.timestamp).getTime() > cut14);
  const velMap: Record<string, number> = {};
  for (const tx of recentTxns) velMap[tx.itemId] = (velMap[tx.itemId] ?? 0) + tx.quantity;

  // Inventory insights
  const inventoryInsights: InventoryInsight[] = inventory.map(item => {
    const totalSold = velMap[item.id] ?? 0;
    const unitsPerDay = Math.round((totalSold / VELOCITY_DAYS) * 10) / 10;
    const stockPct = Math.round((item.currentStock / item.maxStock) * 100);
    const daysOfStockRemaining = unitsPerDay > 0
      ? Math.floor(item.currentStock / unitsPerDay)
      : null;

    let urgencyScore = 1;
    let urgencyLabel: InventoryInsight['urgencyLabel'] = 'LOW';
    if (daysOfStockRemaining !== null && daysOfStockRemaining <= 3) { urgencyScore = 10; urgencyLabel = 'CRITICAL'; }
    else if (daysOfStockRemaining !== null && daysOfStockRemaining <= 7) { urgencyScore = 7; urgencyLabel = 'HIGH'; }
    else if (stockPct <= 30) { urgencyScore = 5; urgencyLabel = 'MEDIUM'; }

    return { id: item.id, name: item.name, stockPct, currentStock: item.currentStock, maxStock: item.maxStock, price: item.price, unitsPerDay, daysOfStockRemaining, urgencyScore, urgencyLabel };
  }).sort((a, b) => b.urgencyScore - a.urgencyScore);

  // Order health
  const myOrders = orders.filter(o => o.requesterId === activeUserId || o.targetId === activeUserId);
  const pendingCount = myOrders.filter(o => o.status === 'pending').length;
  const fulfilledLast7Days = myOrders.filter(o => o.status === 'fulfilled' && new Date(o.timestamp).getTime() > cut7).length;
  const orderItemCounts: Record<string, number> = {};
  for (const o of myOrders) orderItemCounts[o.itemId] = (orderItemCounts[o.itemId] ?? 0) + 1;
  const topOrderedId = Object.entries(orderItemCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const mostOrderedItemName = inventory.find(i => i.id === topOrderedId)?.name ?? 'N/A';

  // Revenue snapshot (Retailers only)
  let revenueSnapshot: RevenueSnapshot | null = null;
  if (userRole === 'Retailer' && posTransactions.length > 0) {
    const last7Rev = posTransactions.filter(t => new Date(t.timestamp).getTime() > cut7).reduce((s, t) => s + t.total, 0);
    const prev7Rev = posTransactions.filter(t => { const ts = new Date(t.timestamp).getTime(); return ts > cut14_7 && ts <= cut7; }).reduce((s, t) => s + t.total, 0);
    const changePct = prev7Rev > 0 ? Math.abs(((last7Rev - prev7Rev) / prev7Rev) * 100).toFixed(0) : '∞';
    const isPositive = last7Rev >= prev7Rev;
    const trendLabel = isPositive ? `▲ +${changePct}% vs prior week` : `▼ -${changePct}% vs prior week`;

    const qtyMap: Record<string, number> = {};
    const revMap: Record<string, number> = {};
    for (const t of posTransactions) {
      qtyMap[t.itemId] = (qtyMap[t.itemId] ?? 0) + t.quantity;
      revMap[t.itemId] = (revMap[t.itemId] ?? 0) + t.total;
    }
    const topQtyId = Object.entries(qtyMap).sort((a, b) => b[1] - a[1])[0]?.[0];
    const topRevId = Object.entries(revMap).sort((a, b) => b[1] - a[1])[0]?.[0];

    revenueSnapshot = {
      last7DayRevenue: Math.round(last7Rev),
      trendLabel,
      isPositive,
      topSellerByQty: inventory.find(i => i.id === topQtyId)?.name ?? 'N/A',
      topSellerByRevenue: inventory.find(i => i.id === topRevId)?.name ?? 'N/A',
    };
  }

  const mySubs = subscriptions.filter(s => s.subscriberId === activeUserId);
  const mySubscribers = subscriptions.filter(s => s.targetId === activeUserId);
  const partnersSummary = `Subscribed to ${mySubs.length} upstream partner(s). ${mySubscribers.length} downstream subscriber(s).`;

  return { role: userRole, orgName, inventoryInsights, orderHealth: { pendingCount, fulfilledLast7Days, mostOrderedItemName }, revenueSnapshot, partnersSummary };
}

// ─── Dynamic prompt generator ─────────────────────────────────────────────────

function getDynamicPrompts(ctx: RichUserContext): string[] {
  const criticals = ctx.inventoryInsights.filter(i => i.urgencyScore >= 7);
  const prompts: string[] = [];

  if (criticals.length > 0) {
    const top = criticals[0];
    const days = top.daysOfStockRemaining !== null ? `${top.daysOfStockRemaining} days left` : 'low stock';
    prompts.push(`Should I reorder ${top.name}? It has ${days}.`);
  } else {
    prompts.push('What items should I reorder this week?');
  }

  prompts.push('Rank my inventory by restock urgency');

  if (ctx.role === 'Retailer' && ctx.revenueSnapshot) {
    prompts.push(`Why did my revenue ${ctx.revenueSnapshot.isPositive ? 'increase' : 'decrease'} this week?`);
  } else if (ctx.role === 'Distributor') {
    prompts.push('Which downstream orders should I prioritize?');
  } else {
    prompts.push('What should I produce more of this week?');
  }

  return prompts;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ChatBoard({ isOpen, onClose }: ChatBoardProps) {
  const { userRole, activeUserId, partners, inventoryByOwner, orders, subscriptions, posTransactions } = useStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);
  useEffect(() => { if (isOpen) setTimeout(() => inputRef.current?.focus(), 300); }, [isOpen]);

  // Pre-compute rich context whenever store data changes
  const richContext = useMemo(() =>
    computeRichContext(userRole, activeUserId, partners, inventoryByOwner, orders, posTransactions, subscriptions),
    [userRole, activeUserId, partners, inventoryByOwner, orders, posTransactions, subscriptions]
  );

  const dynamicPrompts = useMemo(() => getDynamicPrompts(richContext), [richContext]);

  // Derived insight counts for the strip
  const criticalCount = richContext.inventoryInsights.filter(i => i.urgencyScore >= 7).length;

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    const userMsg: Message = { id: 'msg_' + Date.now(), role: 'user', content: trimmed };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsStreaming(true);

    const aiMsgId = 'msg_ai_' + Date.now();
    setMessages(prev => [...prev, { id: aiMsgId, role: 'model', content: '' }]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          userContext: richContext,
        }),
      });

      if (!response.ok) throw new Error('API request failed');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No stream');

      const decoder = new TextDecoder();
      let accumulated = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        const current = accumulated;
        setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: current } : m));
      }
    } catch {
      setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: 'Sorry, I encountered an error. Please try again.' } : m));
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const insertPrompt = (p: string) => {
    setInput(p);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 print:hidden" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col print:hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#111] rounded-xl flex items-center justify-center">
              <Bot className="w-4 h-4 text-[#10B981]" />
            </div>
            <div>
              <div className="font-sans font-bold text-dark text-sm tracking-wide">PULSE AI</div>
              <div className="font-mono text-[10px] text-gray-400 uppercase tracking-widest">
                Predictive Supply Assistant
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

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                <Bot className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="font-sans font-bold text-gray-700 text-sm mb-1">Pulse AI — Predictive Mode</h3>
              <p className="font-sans text-xs text-gray-400 max-w-[240px] leading-relaxed">
                I&apos;ve analyzed your live inventory velocity, order trends, and revenue data. Ask me anything.
              </p>

              {/* Dynamic quick prompts */}
              <div className="flex flex-col gap-2 mt-6 w-full max-w-[280px]">
                {dynamicPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => insertPrompt(prompt)}
                    className="text-left px-4 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-xs font-sans text-gray-600 transition-colors border border-gray-100"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${msg.role === 'user' ? 'bg-[#111]' : 'bg-gray-100'}`}>
                {msg.role === 'user'
                  ? <User className="w-3.5 h-3.5 text-white" />
                  : <Bot className="w-3.5 h-3.5 text-[#10B981]" />
                }
              </div>
              <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl font-sans text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'bg-[#111] text-white rounded-tr-sm' : 'bg-gray-50 text-gray-800 rounded-tl-sm border border-gray-100'}`}>
                {msg.content || (
                  <span className="flex items-center gap-1.5 text-gray-400">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span className="text-xs">Analyzing your data...</span>
                  </span>
                )}
              </div>
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        {/* Pulse Insights Strip */}
        {(criticalCount > 0 || richContext.revenueSnapshot || richContext.orderHealth.pendingCount > 0) && (
          <div className="px-4 pt-2 pb-1 border-t border-gray-100 shrink-0">
            <p className="font-mono text-[9px] text-gray-300 uppercase tracking-widest mb-1.5">Live Insights — click to ask</p>
            <div className="flex gap-2 flex-wrap">
              {criticalCount > 0 && (
                <button
                  onClick={() => insertPrompt('Which items are at risk of stockout and how much should I order?')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-600 text-[11px] font-mono hover:bg-red-100 transition-colors active:scale-95"
                >
                  <AlertTriangle className="w-3 h-3" />
                  {criticalCount} urgent {criticalCount === 1 ? 'item' : 'items'}
                </button>
              )}
              {richContext.revenueSnapshot && (
                <button
                  onClick={() => insertPrompt(`My revenue ${richContext.revenueSnapshot!.isPositive ? 'increased' : 'decreased'} this week (${richContext.revenueSnapshot!.trendLabel}). What's driving this?`)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono border transition-colors active:scale-95 ${richContext.revenueSnapshot.isPositive ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' : 'bg-orange-50 border-orange-200 text-orange-600 hover:bg-orange-100'}`}
                >
                  {richContext.revenueSnapshot.isPositive
                    ? <TrendingUp className="w-3 h-3" />
                    : <TrendingDown className="w-3 h-3" />
                  }
                  {richContext.revenueSnapshot.trendLabel}
                </button>
              )}
              {richContext.orderHealth.pendingCount > 0 && (
                <button
                  onClick={() => insertPrompt('Summarize my pending orders and what I should prioritize.')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 border border-gray-200 text-gray-600 text-[11px] font-mono hover:bg-gray-200 transition-colors active:scale-95"
                >
                  <Clock className="w-3 h-3" />
                  {richContext.orderHealth.pendingCount} pending
                </button>
              )}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="px-4 py-4 border-t border-gray-100 shrink-0">
          <div className="flex items-center gap-2 bg-gray-50 rounded-2xl px-4 py-1 border border-gray-100 focus-within:border-gray-300 transition-colors">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Pulse AI anything..."
              disabled={isStreaming}
              className="flex-1 bg-transparent py-3 font-sans text-sm text-dark placeholder-gray-400 outline-none disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#111] text-white disabled:bg-gray-200 disabled:text-gray-400 transition-colors hover:bg-black active:scale-95 shrink-0"
            >
              {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          <div className="text-center mt-2">
            <span className="font-mono text-[9px] text-gray-300 tracking-wider uppercase">
              Powered by Gemini 2.5 Flash • Velocity-Aware
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
