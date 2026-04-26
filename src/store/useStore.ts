import { create } from 'zustand';
import { SupabaseClient } from '@supabase/supabase-js';

export type InventoryItem = {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  maxStock: number;
  price: number;
};

export type OrderStatus = 'pending' | 'fulfilled' | 'cancelled';

export type Order = {
  id: string;
  requesterId: string;
  targetId: string;
  itemId: string;
  quantity: number;
  status: OrderStatus;
  timestamp: string;
};

export type Alert = {
  id: string;
  message: string;
  timestamp: string;
  read: boolean;
  recipientIds?: string[];
};

export type PosTransaction = {
  id: string;
  itemId: string;
  quantity: number;
  total: number;
  timestamp: string;
};

export type UserRole = 'Retailer' | 'Distributor' | 'Manufacturer';

export type Partner = {
  id: string;
  name: string;
  role: UserRole;
};

export type Subscription = {
  subscriberId: string;
  targetId: string;
};

type StoreState = {
  userRole: UserRole;
  activeUserId: string;
  isHydrated: boolean;
  supabase?: SupabaseClient;
  partners: Partner[];
  subscriptions: Subscription[];
  inventoryByOwner: Record<string, InventoryItem[]>;
  orders: Order[];
  alerts: Alert[];
  posTransactions: PosTransaction[];
  setUserRole: (role: UserRole) => void;
  setSessionOrg: (role: UserRole, orgId: string) => void;
  hydrateFromSupabase: (supabase: SupabaseClient) => Promise<{ ok: boolean; message: string }>;
  subscribeToPartner: (targetId: string) => void;
  unsubscribeFromPartner: (targetId: string) => void;
  addPosTransaction: (itemId: string, quantity: number) => void;
  markAlertRead: (id: string) => void;
  replenishStock: (id: string, quantity: number) => { ok: boolean; message: string };
  fulfillOrder: (orderId: string) => { ok: boolean; message: string };
  updateManufacturerStock: (itemId: string, quantity: number) => void;
};

const roleToUserId = (role: UserRole) => {
  if (role === 'Retailer') return 'ret_1';
  if (role === 'Distributor') return 'dist_1';
  return 'mfg_1';
};

const upstreamRoleFor = (role: UserRole): UserRole | null => {
  if (role === 'Retailer') return 'Distributor';
  if (role === 'Distributor') return 'Manufacturer';
  return null;
};

const initialInventory: InventoryItem[] = [
  { id: '1', name: 'Wireless Mouse', category: 'Electronics', currentStock: 45, maxStock: 200, price: 25 },
  { id: '2', name: 'Mechanical Keyboard', category: 'Electronics', currentStock: 12, maxStock: 100, price: 80 },
  { id: '3', name: 'Cotton T-Shirt', category: 'Clothing', currentStock: 120, maxStock: 200, price: 15 },
  { id: '4', name: 'Denim Jacket', category: 'Clothing', currentStock: 7, maxStock: 50, price: 60 },
  { id: '5', name: 'Organic Milk', category: 'Groceries', currentStock: 30, maxStock: 100, price: 4 },
  { id: '6', name: 'Whole Grain Bread', category: 'Groceries', currentStock: 5, maxStock: 30, price: 3 },
];

const initialPartners: Partner[] = [
  { id: 'ret_1', name: 'Downtown Mart', role: 'Retailer' },
  { id: 'ret_2', name: 'Uptown Groceries', role: 'Retailer' },
  { id: 'dist_1', name: 'Alpha Distribution', role: 'Distributor' },
  { id: 'dist_2', name: 'Beta Supply', role: 'Distributor' },
  { id: 'mfg_1', name: 'Global Electronics', role: 'Manufacturer' },
  { id: 'mfg_2', name: 'National Foods', role: 'Manufacturer' },
];

const seedInventory = () => JSON.parse(JSON.stringify(initialInventory));

export const useStore = create<StoreState>((set) => ({
  userRole: 'Retailer',
  activeUserId: 'ret_1',
  isHydrated: false,
  partners: initialPartners,
  subscriptions: [],
  inventoryByOwner: {
    'ret_1': seedInventory(),
    'dist_1': seedInventory(),
    'mfg_1': seedInventory(),
  },
  orders: [],
  alerts: [],
  posTransactions: [],
  
  setUserRole: (role) => set((state) => {
    const matchingOrg = state.partners.find(partner => partner.role === role);
    return {
      userRole: role,
      activeUserId: matchingOrg?.id ?? roleToUserId(role),
    };
  }),

  setSessionOrg: (role, orgId) => set({
    userRole: role,
    activeUserId: orgId,
  }),

  hydrateFromSupabase: async (supabase) => {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('org_id, organizations(role)')
      .single();

    if (profileError || !profile?.org_id) {
      return { ok: false, message: profileError?.message ?? 'No Supabase profile found.' };
    }

    const organization = Array.isArray(profile.organizations)
      ? profile.organizations[0]
      : profile.organizations;
    const role = (organization?.role ?? 'Retailer') as UserRole;
    const orgId = profile.org_id as string;

    const [
      orgsResult,
      subscriptionsResult,
      inventoryResult,
      ordersResult,
      alertsResult,
      transactionsResult,
    ] = await Promise.all([
      supabase.from('organizations').select('id, name, role'),
      supabase.from('subscriptions').select('subscriber_org_id, target_org_id'),
      supabase
        .from('inventory')
        .select('org_id, current_stock, inventory_items(id, sku, name, category, price, max_stock)')
        .eq('org_id', orgId),
      supabase.from('orders').select('id, requester_org_id, target_org_id, item_id, quantity, status, created_at'),
      supabase
        .from('alert_recipients')
        .select('read, alerts(id, message, created_at)')
        .eq('org_id', orgId),
      supabase.from('pos_transactions').select('id, item_id, quantity, total, created_at').eq('org_id', orgId),
    ]);

    const firstError =
      orgsResult.error ??
      subscriptionsResult.error ??
      inventoryResult.error ??
      ordersResult.error ??
      alertsResult.error ??
      transactionsResult.error;

    if (firstError) {
      return { ok: false, message: firstError.message };
    }

    const partners: Partner[] = (orgsResult.data ?? []).map(org => ({
      id: org.id,
      name: org.name,
      role: org.role as UserRole,
    }));

    const subscriptions: Subscription[] = (subscriptionsResult.data ?? []).map(subscription => ({
      subscriberId: subscription.subscriber_org_id,
      targetId: subscription.target_org_id,
    }));

    const inventory: InventoryItem[] = (inventoryResult.data ?? []).map(row => {
      const item = Array.isArray(row.inventory_items) ? row.inventory_items[0] : row.inventory_items;
      return {
        id: item.id,
        name: item.name,
        category: item.category,
        currentStock: row.current_stock,
        maxStock: item.max_stock,
        price: Number(item.price),
      };
    });

    const orders: Order[] = (ordersResult.data ?? []).map(order => ({
      id: order.id,
      requesterId: order.requester_org_id,
      targetId: order.target_org_id,
      itemId: order.item_id,
      quantity: order.quantity,
      status: order.status as OrderStatus,
      timestamp: order.created_at,
    }));

    const alerts: Alert[] = (alertsResult.data ?? []).flatMap(row => {
      const alert = Array.isArray(row.alerts) ? row.alerts[0] : row.alerts;
      if (!alert) return [];
      return [{
        id: alert.id,
        message: alert.message,
        timestamp: alert.created_at,
        read: row.read,
        recipientIds: [orgId],
      }];
    });

    const posTransactions: PosTransaction[] = (transactionsResult.data ?? []).map(transaction => ({
      id: transaction.id,
      itemId: transaction.item_id,
      quantity: transaction.quantity,
      total: Number(transaction.total),
      timestamp: transaction.created_at,
    }));

    set({
      userRole: role,
      activeUserId: orgId,
      isHydrated: true,
      supabase,
      partners,
      subscriptions,
      inventoryByOwner: { [orgId]: inventory },
      orders,
      alerts,
      posTransactions,
    });

    return { ok: true, message: 'Loaded Supabase data.' };
  },

  subscribeToPartner: (targetId) => set((state) => {
    const target = state.partners.find(partner => partner.id === targetId);
    if (!target || target.role !== upstreamRoleFor(state.userRole)) {
      return state;
    }

    if (state.subscriptions.some(s => s.subscriberId === state.activeUserId && s.targetId === targetId)) {
      return state;
    }

    if (state.supabase) {
      void state.supabase
        .from('subscriptions')
        .insert({ subscriber_org_id: state.activeUserId, target_org_id: targetId })
        .then();
    }

    return {
      subscriptions: [...state.subscriptions, { subscriberId: state.activeUserId, targetId }]
    };
  }),

  unsubscribeFromPartner: (targetId) => set((state) => {
    if (state.supabase) {
      void state.supabase
        .from('subscriptions')
        .delete()
        .eq('subscriber_org_id', state.activeUserId)
        .eq('target_org_id', targetId)
        .then();
    }

    return {
      subscriptions: state.subscriptions.filter(s => !(s.subscriberId === state.activeUserId && s.targetId === targetId))
    };
  }),
  
  replenishStock: (id, quantity) => {
    let result = { ok: false, message: 'Unable to restock this item.' };

    set((state) => {
      if (state.userRole === 'Manufacturer') {
        result = { ok: false, message: 'Manufacturers do not request upstream restocks.' };
        return state;
      }

      const myInventory = state.inventoryByOwner[state.activeUserId];
      const item = myInventory.find(i => i.id === id);
      if (!item) {
        result = { ok: false, message: 'Item not found in inventory.' };
        return state;
      }

      if (item.currentStock >= item.maxStock) {
        result = { ok: false, message: `${item.name} is already at maximum stock.` };
        return state;
      }

      const targets = state.subscriptions
        .filter(subscription => subscription.subscriberId === state.activeUserId)
        .map(subscription => state.partners.find(partner => partner.id === subscription.targetId))
        .filter((partner): partner is Partner => Boolean(partner));

      if (targets.length === 0) {
        result = {
          ok: false,
          message: 'Action denied: subscribe to an upstream partner before restocking.',
        };
        return state;
      }

      const orderQuantity = Math.min(quantity, item.maxStock - item.currentStock);
      
      const newOrders = [...state.orders];
      const newAlerts = [...state.alerts];
      
      // Create pending order for each subscribed upstream target (only if no existing pending order)
      const createdOrders: Order[] = [];

      targets.forEach(target => {
        const alreadyPending = state.orders.some(
          o => o.requesterId === state.activeUserId && o.targetId === target.id && o.itemId === id && o.status === 'pending'
        );
        if (alreadyPending) return;

        const newOrder = {
          id: 'ord_' + Math.random().toString(36).substring(2, 9),
          requesterId: state.activeUserId,
          targetId: target.id,
          itemId: id,
          quantity: orderQuantity,
          status: 'pending' as const,
          timestamp: new Date().toISOString()
        };

        createdOrders.push(newOrder);
        newOrders.push(newOrder);
      });

      // If all were duplicates, report so
      if (newOrders.length === state.orders.length) {
        result = { ok: false, message: `A pending order for ${item.name} already exists. Awaiting fulfillment.` };
        return state;
      }

      const targetNames = targets.map(t => t.name).join(', ');
      
      newAlerts.unshift({
        id: 'alt_' + Math.random().toString(36).substring(2, 9),
        message: `[ PENDING ORDER ] ${state.userRole} requested ${orderQuantity} units of ${item.name} from ${targetNames}`,
        timestamp: new Date().toISOString(),
        read: false,
        recipientIds: [...targets.map(t => t.id), state.activeUserId],
      });

      if (state.supabase && createdOrders.length > 0) {
        void state.supabase
          .from('orders')
          .insert(createdOrders.map(order => ({
            requester_org_id: order.requesterId,
            target_org_id: order.targetId,
            item_id: order.itemId,
            quantity: order.quantity,
            status: order.status,
          })))
          .then(() =>
            state.supabase?.rpc('create_alert_for_orgs', {
              alert_message: `[ PENDING ORDER ] ${state.userRole} requested ${orderQuantity} units of ${item.name} from ${targetNames}`,
              recipient_org_ids: [...targets.map(t => t.id), state.activeUserId],
            })
          );
      }

      result = {
        ok: true,
        message: `Order submitted to ${targetNames} for ${orderQuantity} units. Pending fulfillment.`,
      };

      return {
        orders: newOrders,
        alerts: newAlerts
      };
    });

    return result;
  },

  fulfillOrder: (orderId) => {
    let result = { ok: false, message: 'Order could not be fulfilled.' };
    
    set((state) => {
      const order = state.orders.find(o => o.id === orderId);
      if (!order) return state;
      
      if (order.status !== 'pending') {
        result = { ok: false, message: 'Order is not pending.' };
        return state;
      }
      
      if (order.targetId !== state.activeUserId) {
        result = { ok: false, message: 'Not authorized to fulfill this order.' };
        return state;
      }
      
      const myInventory = state.inventoryByOwner[state.activeUserId];
      const myItem = myInventory.find(i => i.id === order.itemId);
      
      if (!myItem || myItem.currentStock < order.quantity) {
        result = { ok: false, message: 'Insufficient stock to fulfill this order.' };
        return state;
      }
      
      // Execute the transfer
      const updatedMyInventory = myInventory.map(i => {
        if (i.id === order.itemId) {
          return { ...i, currentStock: i.currentStock - order.quantity };
        }
        return i;
      });
      
      const requesterInventory = state.inventoryByOwner[order.requesterId] || seedInventory();
      const updatedRequesterInventory = requesterInventory.map(i => {
        if (i.id === order.itemId) {
          return { ...i, currentStock: Math.min(i.maxStock, i.currentStock + order.quantity) };
        }
        return i;
      });
      
      const newOrders = state.orders.map(o => o.id === orderId ? { ...o, status: 'fulfilled' as const } : o);
      
      const requesterPartner = state.partners.find(p => p.id === order.requesterId);
      const newAlerts = [...state.alerts];
      newAlerts.unshift({
        id: 'alt_' + Math.random().toString(36).substring(2, 9),
        message: `[ ORDER FULFILLED ] ${order.quantity} units of ${myItem.name} delivered to ${requesterPartner?.name || order.requesterId}.`,
        timestamp: new Date().toISOString(),
        read: false,
        recipientIds: [order.requesterId, state.activeUserId],
      });
      
      result = { ok: true, message: 'Order successfully fulfilled and stock transferred.' };

      if (state.supabase && !order.id.startsWith('ord_')) {
        void state.supabase.rpc('fulfill_order', { order_id: order.id }).then();
      }
      
      return {
        inventoryByOwner: {
          ...state.inventoryByOwner,
          [state.activeUserId]: updatedMyInventory,
          [order.requesterId]: updatedRequesterInventory,
        },
        orders: newOrders,
        alerts: newAlerts,
      };
    });
    
    return result;
  },

  updateManufacturerStock: (itemId, quantity) => {
    set((state) => {
      if (state.userRole !== 'Manufacturer') return state;
      
      const myInventory = state.inventoryByOwner[state.activeUserId];
      const item = myInventory.find(i => i.id === itemId);
      if (!item) return state;

      const actualAdded = Math.min(quantity, item.maxStock - item.currentStock);
      const updatedInventory = myInventory.map(i => {
        if (i.id === itemId) {
          return { ...i, currentStock: Math.min(i.maxStock, i.currentStock + quantity) };
        }
        return i;
      });

      const newAlert = {
        id: 'alt_' + Math.random().toString(36).substring(2, 9),
        message: `[ STOCK UPDATED ] ${item.name} increased by ${actualAdded} units.`,
        timestamp: new Date().toISOString(),
        read: false,
        recipientIds: [state.activeUserId],
      };

      if (state.supabase) {
        void state.supabase.rpc('increase_my_stock', {
          item_id: itemId,
          quantity,
        }).then();
      }
      
      return {
        inventoryByOwner: {
          ...state.inventoryByOwner,
          [state.activeUserId]: updatedInventory
        },
        alerts: [newAlert, ...state.alerts]
      };
    });
  },

    addPosTransaction: (itemId, quantity) => {
    set((state) => {
      const myInventory = state.inventoryByOwner[state.activeUserId];
      const item = myInventory.find(i => i.id === itemId);
      if (!item) return state;
      
      const newTransaction: PosTransaction = {
        id: Math.random().toString(36).substring(2, 9),
        itemId,
        quantity,
        total: item.price * quantity,
        timestamp: new Date().toISOString(),
      };
      
      const updatedInventory = myInventory.map(i => {
        if (i.id === itemId) {
          return { ...i, currentStock: Math.max(0, i.currentStock - quantity) };
        }
        return i;
      });
      
      const updatedItem = updatedInventory.find(i => i.id === itemId)!;
      const isLowStock = (updatedItem.currentStock / updatedItem.maxStock) < 0.3;
      
      const newOrders = [...state.orders];
      const newAlerts = [...state.alerts];
      
      if (isLowStock) {
        // Find subscribed targets
        const targets = state.subscriptions
          .filter(s => s.subscriberId === state.activeUserId)
          .map(s => state.partners.find(p => p.id === s.targetId))
          .filter(Boolean) as Partner[];
          
        if (targets.length > 0) {
          const hasOpenDraft = state.orders.some(o => o.itemId === itemId && o.requesterId === state.activeUserId && o.status === 'pending');
          if (!hasOpenDraft) {
            const orderQuantity = updatedItem.maxStock - updatedItem.currentStock;
            const autoOrders: Order[] = [];
            
            targets.forEach(target => {
              const autoOrder = {
                id: 'ord_' + Math.random().toString(36).substring(2, 9),
                requesterId: state.activeUserId,
                targetId: target.id,
                itemId,
                quantity: orderQuantity,
                status: 'pending' as const,
                timestamp: new Date().toISOString(),
              };

              autoOrders.push(autoOrder);
              newOrders.push(autoOrder);
            });
            
            const targetNames = targets.map(t => t.name).join(', ');
            newAlerts.unshift({
              id: 'alt_' + Math.random().toString(36).substring(2, 9),
              message: `[ AUTO-TRIGGER ] Pending order created for ${item.name} (${orderQuantity} units) to ${targetNames}`,
              timestamp: new Date().toISOString(),
              read: false,
              recipientIds: [...targets.map(t => t.id), state.activeUserId],
            });

            if (state.supabase && autoOrders.length > 0) {
              void state.supabase
                .from('orders')
                .insert(autoOrders.map(order => ({
                  requester_org_id: order.requesterId,
                  target_org_id: order.targetId,
                  item_id: order.itemId,
                  quantity: order.quantity,
                  status: order.status,
                })))
                .then(() =>
                  state.supabase?.rpc('create_alert_for_orgs', {
                    alert_message: `[ AUTO-TRIGGER ] Pending order created for ${item.name} (${orderQuantity} units) to ${targetNames}`,
                    recipient_org_ids: [...targets.map(t => t.id), state.activeUserId],
                  })
                );
            }
          }
        }
      }

      if (state.supabase) {
        void state.supabase.from('pos_transactions').insert({
          org_id: state.activeUserId,
          item_id: itemId,
          quantity,
          total: newTransaction.total,
        }).then();

        void state.supabase
          .from('inventory')
          .update({ current_stock: updatedItem.currentStock })
          .eq('org_id', state.activeUserId)
          .eq('item_id', itemId).then();
      }
      
      return {
        inventoryByOwner: {
          ...state.inventoryByOwner,
          [state.activeUserId]: updatedInventory
        },
        posTransactions: [newTransaction, ...state.posTransactions],
        orders: newOrders,
        alerts: newAlerts
      };
    });
  },
  
  markAlertRead: (id) => {
    set((state) => ({
      alerts: state.alerts.map(a => a.id === id ? { ...a, read: true } : a)
    }));
    const state = useStore.getState();
    if (state.supabase) {
      void state.supabase
        .from('alert_recipients')
        .update({ read: true })
        .eq('alert_id', id)
        .eq('org_id', state.activeUserId).then();
    }
  },
}));
