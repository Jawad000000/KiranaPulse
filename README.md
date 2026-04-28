# KiranaPulse

Universal Supply Chain Management Platform — KiranaPulse is a B2B SaaS that enables real-time supply chain operations across any industry sector, connecting Manufacturers, Distributors, and Retailers in a structured 3-tier hierarchy — applicable to FMCG, electronics, pharma, agriculture, and beyond.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database / Auth:** Supabase (PostgreSQL + RLS)
- **State Management:** Zustand
- **Styling:** Tailwind CSS v4 (inline `@theme`)
- **Animations:** GSAP
- **AI Integration:** Google Gemini 2.5 Flash via Server-Sent Events (SSE)

## Core Mechanics

- **Role-Based Access (RBAC):** Users sign up and are assigned an organization role (Retailer, Distributor, or Manufacturer). Each role sees different UI panels and has different permissions.
- **Inventory & Auto-Restock:** A Point-of-Sale (POS) system depletes local stock. When inventory drops below 30%, the system automatically generates an order to upstream subscribed partners and instantly triggers fulfillment via Postgres RPCs.
- **Real-time Subscriptions:** Distributors subscribe to Manufacturers. Retailers subscribe to Distributors. Orders flow upstream, inventory flows downstream.

## Key Features

- **Pulse AI Predictive Assistant:** An integrated, data-aware chatbot powered by Gemini 2.5 Flash. It analyzes sales velocity, inventory days remaining, and revenue trends to offer real-time, actionable supply chain recommendations.
- **DOCX Logbook Export:** Generates professional, offline-ready `.docx` transaction logs (single or bulk based on custom date ranges) using client-side document generation.
- **Thermal Receipts:** Generates classic 80mm thermal-style receipts from the POS checkout and order fulfillment screens, fully optimized for browser printing via CSS print media queries.

## Getting Started

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your `.env.local` with your Supabase and Gemini credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   GEMINI_API_KEY=your_gemini_api_key
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

**Note on Environment Variables:** Be sure to add `GEMINI_API_KEY` to your Netlify Site settings under "Environment variables" to enable the Pulse AI functionality in production.
