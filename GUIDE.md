# KiranaPulse - Team Playbook & End-to-End Testing Guide

## 1. Project Overview
KiranaPulse is a specialized B2B supply chain simulation platform built with Next.js 16, Supabase, and Tailwind CSS v4. It is designed to model the synchronized flow of inventory across three distinct organizational tiers:
1. **Manufacturers** (The top of the chain)
2. **Distributors** (The middle-men)
3. **Retailers** (The consumer-facing storefronts)

The core architecture utilizes **Row-Level Security (RLS)** in Supabase to ensure data isolation, alongside a global Zustand state that hydrates in real-time.

---

## 2. Core Mechanics & Data Flow

### The Subscription Protocol
The supply chain is strictly hierarchical. Before any goods can be exchanged, a downstream entity must "subscribe" to an upstream entity.
- **Retailers** must subscribe to **Distributors**.
- **Distributors** must subscribe to **Manufacturers**.
- *Note:* Manufacturers do not subscribe to anyone; they generate raw stock.

### The Order & Fulfillment Lifecycle
When a downstream organization needs inventory, the following sequence occurs:
1. **Request:** The downstream user (e.g., Retailer) clicks "Restock". A `pending` order is created in the database.
2. **Notification:** The upstream user (e.g., Distributor) instantly receives a `[ PENDING ORDER ]` alert on their dashboard.
3. **Fulfillment:** The upstream user logs in, navigates to their **Orders** page, and clicks **"Complete Checkout"**.
4. **Inventory Transfer:** The system executes a secure Postgres RPC (`fulfill_order`). It atomically deducts the requested amount from the upstream user's `current_stock` and adds it to the downstream user's `current_stock`.

### Point-of-Sale (POS) Auto-Restock
If a Retailer sells items through the POS terminal and their stock drops **below 30%** of its maximum capacity, the system will *automatically* generate a pending restock order to their subscribed Distributor without human intervention.

---

## 3. End-to-End Testing Instructions

To verify that the application and database triggers are functioning correctly, please execute the following flow exactly in order.

### Phase 1: Manufacturer Initialization
1. **Login:** Access the application and log in using a Manufacturer account.
2. **Review Inventory:** Navigate to the **Inventory** tab. You will see your global stock levels.
3. **Restock:** Click "Update Stock" on any item (e.g., Wireless Mouse) to bump your inventory up to maximum capacity. You will receive an alert confirming the stock addition.
4. **Log Out.**

### Phase 2: Distributor Procurement
1. **Login:** Log in as a Distributor.
2. **Subscribe:** Navigate to the **Partners** tab. You will see a list of available Manufacturers. Click **Subscribe** on the Manufacturer you just used.
3. **Request Stock:** Navigate to the **Inventory** tab. Your stock will likely be 0. Click **Restock** on an item. This sends a pending order directly to the Manufacturer.
4. **Log Out.**

### Phase 3: Manufacturer Fulfillment
1. **Login:** Log back in as the Manufacturer.
2. **Fulfill Order:** Navigate to the **Orders** tab. You will see the incoming request from the Distributor. Click **Complete Checkout**.
3. **Verify:** Check your inventory; it should now be deducted.
4. **Log Out.**

### Phase 4: Retailer Automation
1. **Login:** Log in as a Retailer.
2. **Subscribe:** Go to the **Partners** tab and subscribe to the Distributor who just received inventory.
3. **POS Sale:** Navigate to the **POS / Sales** tab. Select the item that the Distributor has in stock. Process a sale for enough units to drop your stock **below 30%**.
4. **Auto-Trigger:** The moment stock drops below 30%, you will immediately receive an `[ AUTO-TRIGGER ]` alert stating a pending order was automatically created.
5. **Log Out.**

### Phase 5: Final Distributor Fulfillment
1. **Login:** Log in as the Distributor.
2. **Approve Auto-Order:** Check your **Orders** tab. You will see the auto-generated order from the Retailer. Click **Complete Checkout** to fulfill it.
3. **Success:** The Retailer's stock is now replenished, and the full supply chain lifecycle is complete.
