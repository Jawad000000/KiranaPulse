# KiranaPulse

KiranaPulse is a B2B supply chain simulation platform. It models the flow of inventory from Manufacturers to Distributors to Retailers, tracking real-time stock levels, automated order fulfillment, and multi-tier subscriptions. 

The UI is built around a dark, brutalist "signal" aesthetic, prioritizing raw functionality, high contrast, and fast interactions over unnecessary padding.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database / Auth:** Supabase (PostgreSQL + RLS)
- **State Management:** Zustand
- **Styling:** Tailwind CSS v4 (inline `@theme`)
- **Animations:** GSAP

## Core Mechanics

- **Role-Based Access (RBAC):** Users sign up and are assigned an organization role (Retailer, Distributor, or Manufacturer). Each role sees different UI panels and has different permissions.
- **Inventory & Auto-Restock:** A Point-of-Sale (POS) system depletes local stock. When inventory drops below 30%, the system automatically generates an order to upstream subscribed partners and instantly triggers fulfillment via Postgres RPCs.
- **Real-time Subscriptions:** Distributors subscribe to Manufacturers. Retailers subscribe to Distributors. Orders flow upstream, inventory flows downstream.

## Getting Started

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. Run the local development server:
   ```bash
   npm run dev
   ```

## Database Setup

The backend relies on several custom tables (`organizations`, `inventory`, `orders`, `subscriptions`) and stored RPC functions to securely move stock between tenants. 

Run the SQL migration found in `/supabase/migrations/20260426190000_kiranapulse_initial_schema.sql` directly in your Supabase SQL editor to scaffold the entire backend and set up the Row Level Security (RLS) policies.

## Deployment

This project is optimized for deployment on Netlify using the native Next.js Runtime v5. The `netlify.toml` file is configured out-of-the-box for production builds.
