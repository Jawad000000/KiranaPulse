-- KiranaPulse initial Supabase schema.
-- Run this in Supabase SQL Editor or with `supabase db push`.

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'organization_role') then
    create type organization_role as enum ('Retailer', 'Distributor', 'Manufacturer');
  end if;

  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type order_status as enum ('pending', 'fulfilled', 'cancelled');
  end if;
end $$;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role organization_role not null,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  subscriber_org_id uuid not null references public.organizations(id) on delete cascade,
  target_org_id uuid not null references public.organizations(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (subscriber_org_id, target_org_id),
  check (subscriber_org_id <> target_org_id)
);

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  sku text unique,
  name text not null,
  category text not null,
  price numeric(10, 2) not null default 0,
  max_stock int not null default 100 check (max_stock >= 0)
);

create table if not exists public.inventory (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  item_id uuid not null references public.inventory_items(id) on delete cascade,
  current_stock int not null default 0 check (current_stock >= 0),
  unique (org_id, item_id)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  requester_org_id uuid not null references public.organizations(id) on delete cascade,
  target_org_id uuid not null references public.organizations(id) on delete cascade,
  item_id uuid not null references public.inventory_items(id) on delete restrict,
  quantity int not null check (quantity > 0),
  status order_status not null default 'pending',
  created_at timestamptz not null default now(),
  fulfilled_at timestamptz,
  check (requester_org_id <> target_org_id)
);

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.alert_recipients (
  alert_id uuid not null references public.alerts(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  read boolean not null default false,
  primary key (alert_id, org_id)
);

create table if not exists public.pos_transactions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  item_id uuid not null references public.inventory_items(id) on delete restrict,
  quantity int not null check (quantity > 0),
  total numeric(10, 2) not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_profiles_org_id on public.profiles(org_id);
create index if not exists idx_subscriptions_subscriber on public.subscriptions(subscriber_org_id);
create index if not exists idx_subscriptions_target on public.subscriptions(target_org_id);
create index if not exists idx_inventory_org on public.inventory(org_id);
create index if not exists idx_orders_requester on public.orders(requester_org_id);
create index if not exists idx_orders_target on public.orders(target_org_id);
create index if not exists idx_alert_recipients_org on public.alert_recipients(org_id);
create index if not exists idx_pos_transactions_org on public.pos_transactions(org_id);

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.inventory_items enable row level security;
alter table public.inventory enable row level security;
alter table public.orders enable row level security;
alter table public.alerts enable row level security;
alter table public.alert_recipients enable row level security;
alter table public.pos_transactions enable row level security;

create or replace function public.get_my_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select org_id from public.profiles where id = auth.uid();
$$;

create or replace function public.create_alert_for_orgs(alert_message text, recipient_org_ids uuid[])
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_alert_id uuid;
  recipient_org_id uuid;
begin
  insert into public.alerts (message)
  values (alert_message)
  returning id into new_alert_id;

  foreach recipient_org_id in array recipient_org_ids loop
    insert into public.alert_recipients (alert_id, org_id)
    values (new_alert_id, recipient_org_id)
    on conflict do nothing;
  end loop;

  return new_alert_id;
end;
$$;

create or replace function public.fulfill_order(order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  order_row public.orders%rowtype;
  supplier_stock int;
  item_name text;
begin
  select * into order_row
  from public.orders
  where id = order_id
  for update;

  if not found then
    raise exception 'Order not found';
  end if;

  if order_row.target_org_id <> public.get_my_org_id() then
    raise exception 'Not authorized to fulfill this order';
  end if;

  if order_row.status <> 'pending' then
    raise exception 'Order is not pending';
  end if;

  select current_stock into supplier_stock
  from public.inventory
  where org_id = order_row.target_org_id and item_id = order_row.item_id
  for update;

  if supplier_stock is null or supplier_stock < order_row.quantity then
    raise exception 'Insufficient stock';
  end if;

  update public.inventory
  set current_stock = current_stock - order_row.quantity
  where org_id = order_row.target_org_id and item_id = order_row.item_id;

  insert into public.inventory (org_id, item_id, current_stock)
  values (order_row.requester_org_id, order_row.item_id, order_row.quantity)
  on conflict (org_id, item_id) do update
  set current_stock = least(
    public.inventory.current_stock + excluded.current_stock,
    (select max_stock from public.inventory_items where id = order_row.item_id)
  );

  update public.orders
  set status = 'fulfilled', fulfilled_at = now()
  where id = order_row.id;

  select name into item_name from public.inventory_items where id = order_row.item_id;

  perform public.create_alert_for_orgs(
    '[ ORDER FULFILLED ] ' || order_row.quantity || ' units of ' || coalesce(item_name, 'inventory') || ' delivered.',
    array[order_row.requester_org_id, order_row.target_org_id]
  );
end;
$$;

create or replace function public.increase_my_stock(item_id uuid, quantity int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  my_org uuid := public.get_my_org_id();
  my_role organization_role;
  item_name text;
begin
  if quantity <= 0 then
    raise exception 'Quantity must be positive';
  end if;

  select role into my_role from public.organizations where id = my_org;

  if my_role <> 'Manufacturer' then
    raise exception 'Only manufacturers can directly update stock';
  end if;

  insert into public.inventory (org_id, item_id, current_stock)
  values (my_org, item_id, quantity)
  on conflict (org_id, item_id) do update
  set current_stock = least(
    public.inventory.current_stock + excluded.current_stock,
    (select max_stock from public.inventory_items where id = item_id)
  );

  select name into item_name from public.inventory_items where id = item_id;

  perform public.create_alert_for_orgs(
    '[ STOCK UPDATED ] ' || coalesce(item_name, 'Inventory') || ' increased by ' || quantity || ' units.',
    array[my_org]
  );
end;
$$;

drop policy if exists "Anyone can view orgs" on public.organizations;
create policy "Anyone can view orgs" on public.organizations
  for select using (true);

drop policy if exists "Authenticated users create orgs" on public.organizations;
create policy "Authenticated users create orgs" on public.organizations
  for insert with check (auth.uid() is not null);

drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "Users create own profile" on public.profiles;
create policy "Users create own profile" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "Read own subscriptions" on public.subscriptions;
create policy "Read own subscriptions" on public.subscriptions
  for select using (subscriber_org_id = public.get_my_org_id() or target_org_id = public.get_my_org_id());

drop policy if exists "Create own subscriptions" on public.subscriptions;
create policy "Create own subscriptions" on public.subscriptions
  for insert with check (subscriber_org_id = public.get_my_org_id());

drop policy if exists "Delete own subscriptions" on public.subscriptions;
create policy "Delete own subscriptions" on public.subscriptions
  for delete using (subscriber_org_id = public.get_my_org_id());

drop policy if exists "Anyone can view item catalog" on public.inventory_items;
create policy "Anyone can view item catalog" on public.inventory_items
  for select using (auth.uid() is not null);

drop policy if exists "Read own inventory" on public.inventory;
create policy "Read own inventory" on public.inventory
  for select using (org_id = public.get_my_org_id());

drop policy if exists "Modify own inventory" on public.inventory;
create policy "Modify own inventory" on public.inventory
  for all using (org_id = public.get_my_org_id())
  with check (org_id = public.get_my_org_id());

drop policy if exists "Read related orders" on public.orders;
create policy "Read related orders" on public.orders
  for select using (requester_org_id = public.get_my_org_id() or target_org_id = public.get_my_org_id());

drop policy if exists "Create own orders" on public.orders;
create policy "Create own orders" on public.orders
  for insert with check (requester_org_id = public.get_my_org_id());

drop policy if exists "Update targeted orders" on public.orders;
create policy "Update targeted orders" on public.orders
  for update using (target_org_id = public.get_my_org_id());

drop policy if exists "Read own alerts" on public.alerts;
create policy "Read own alerts" on public.alerts
  for select using (
    exists (
      select 1 from public.alert_recipients ar
      where ar.alert_id = alerts.id and ar.org_id = public.get_my_org_id()
    )
  );

drop policy if exists "Read own alert recipients" on public.alert_recipients;
create policy "Read own alert recipients" on public.alert_recipients
  for select using (org_id = public.get_my_org_id());

drop policy if exists "Update own alert read status" on public.alert_recipients;
create policy "Update own alert read status" on public.alert_recipients
  for update using (org_id = public.get_my_org_id());

drop policy if exists "Read own transactions" on public.pos_transactions;
create policy "Read own transactions" on public.pos_transactions
  for select using (org_id = public.get_my_org_id());

drop policy if exists "Create own transactions" on public.pos_transactions;
create policy "Create own transactions" on public.pos_transactions
  for insert with check (org_id = public.get_my_org_id());

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on function public.get_my_org_id() to authenticated;
grant execute on function public.create_alert_for_orgs(text, uuid[]) to authenticated;
grant execute on function public.fulfill_order(uuid) to authenticated;
grant execute on function public.increase_my_stock(uuid, int) to authenticated;

insert into public.organizations (id, name, role)
values
  ('00000000-0000-0000-0000-000000000101', 'Downtown Mart', 'Retailer'),
  ('00000000-0000-0000-0000-000000000102', 'Uptown Groceries', 'Retailer'),
  ('00000000-0000-0000-0000-000000000201', 'Alpha Distribution', 'Distributor'),
  ('00000000-0000-0000-0000-000000000202', 'Beta Supply', 'Distributor'),
  ('00000000-0000-0000-0000-000000000301', 'Global Electronics', 'Manufacturer'),
  ('00000000-0000-0000-0000-000000000302', 'National Foods', 'Manufacturer')
on conflict (id) do nothing;

insert into public.inventory_items (id, sku, name, category, price, max_stock)
values
  ('10000000-0000-0000-0000-000000000001', '1', 'Wireless Mouse', 'Electronics', 25, 200),
  ('10000000-0000-0000-0000-000000000002', '2', 'Mechanical Keyboard', 'Electronics', 80, 100),
  ('10000000-0000-0000-0000-000000000003', '3', 'Cotton T-Shirt', 'Clothing', 15, 200),
  ('10000000-0000-0000-0000-000000000004', '4', 'Denim Jacket', 'Clothing', 60, 50),
  ('10000000-0000-0000-0000-000000000005', '5', 'Organic Milk', 'Groceries', 4, 100),
  ('10000000-0000-0000-0000-000000000006', '6', 'Whole Grain Bread', 'Groceries', 3, 30)
on conflict (id) do update set
  sku = excluded.sku,
  name = excluded.name,
  category = excluded.category,
  price = excluded.price,
  max_stock = excluded.max_stock;

insert into public.inventory (org_id, item_id, current_stock)
select org.id, item.id,
  case item.sku
    when '1' then 45
    when '2' then 12
    when '3' then 120
    when '4' then 7
    when '5' then 30
    when '6' then 5
    else 0
  end
from public.organizations org
cross join public.inventory_items item
where org.id in (
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000201',
  '00000000-0000-0000-0000-000000000301'
)
on conflict (org_id, item_id) do nothing;
