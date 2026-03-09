-- Enable UUID extension
create extension if not exists "pgcrypto";

-- 1. STORES table
create table public.stores (
    id text primary key, -- Custom ID like 'boutique-name-1234'
    user_id uuid references auth.users not null,
    name text not null,
    description text,
    logo text,
    bank_name text,
    account_name text,
    account_number text,
    whatsapp_number text,
    created_at timestamp
    with
        time zone default now()
);

-- 2. PRODUCTS table
create table public.products (
  id uuid default gen_random_uuid() primary key,
  store_id text references public.stores(id) on delete cascade not null,
  name text not null,
  description text,
  price numeric(12,2) not null,
  images text[] default '{}',
  category text,
  stock integer default 0,
  status text default 'In Stock',
  created_at timestamp with time zone default now()
);

-- 3. PRODUCT VARIANTS table
create table public.product_variants (
    id uuid default gen_random_uuid () primary key,
    product_id uuid references public.products (id) on delete cascade not null,
    color text not null,
    size text not null,
    stock integer default 0,
    created_at timestamp
    with
        time zone default now()
);

-- 4. ORDERS table
create table public.orders (
    id uuid default gen_random_uuid () primary key,
    store_id text references public.stores (id) on delete cascade not null,
    customer_name text not null,
    customer_phone text not null,
    total numeric(12, 2) not null,
    status text not null, -- e.g., 'Pending Payment', 'Completed'
    payment_method text not null, -- e.g., 'Bank Transfer', 'Cash'
    payment_proof_url text,
    source text default 'Storefront',
    created_at timestamp
    with
        time zone default now()
);

-- 5. ORDER ITEMS table
create table public.order_items (
    id uuid default gen_random_uuid () primary key,
    order_id uuid references public.orders (id) on delete cascade not null,
    product_id uuid not null,
    variant_id uuid,
    variant_color text,
    variant_size text,
    name text not null,
    price numeric(12, 2) not null,
    quantity integer not null,
    created_at timestamp
    with
        time zone default now()
);

-- Enable RLS
alter table public.stores enable row level security;

alter table public.products enable row level security;

alter table public.product_variants enable row level security;

alter table public.orders enable row level security;

alter table public.order_items enable row level security;

-- Policies for STORES: Owners can do everything, anyone can view
create policy "Owners can manage their stores" on public.stores for all using (auth.uid () = user_id);

create policy "Anyone can view stores" on public.stores for
select using (true);

-- Policies for PRODUCTS: Owners manage, anyone views
create policy "Owners can manage products" on public.products for all using (
    exists (
        select 1
        from public.stores
        where
            id = products.store_id
            and user_id = auth.uid ()
    )
);

create policy "Anyone can view products" on public.products for
select using (true);

-- Policies for VARIANTS: Owners manage, anyone views
create policy "Owners can manage variants" on public.product_variants for all using (
    exists (
        select 1
        from public.products p
            join public.stores s on s.id = p.store_id
        where
            p.id = product_variants.product_id
            and s.user_id = auth.uid ()
    )
);

create policy "Anyone can view variants" on public.product_variants for
select using (true);

-- Policies for ORDERS: Owners manage their store's orders, Storefront can insert
create policy "Owners can manage orders" on public.orders for all using (
    exists (
        select 1
        from public.stores
        where
            id = orders.store_id
            and user_id = auth.uid ()
    )
);

create policy "Anyone can place orders" on public.orders for
insert
with
    check (true);

-- Policies for ORDER ITEMS: Same logic as Orders
create policy "Owners can manage order items" on public.order_items for all using (
    exists (
        select 1
        from public.orders o
            join public.stores s on s.id = o.store_id
        where
            o.id = order_items.order_id
            and s.user_id = auth.uid ()
    )
);

create policy "Anyone can add order items" on public.order_items for
insert
with
    check (true);