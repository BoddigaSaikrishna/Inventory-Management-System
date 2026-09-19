-- VoiceStock AI — Supabase Database Schema
-- Run this script in your Supabase SQL Editor (Dashboard > SQL Editor > New query)

-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. Create products table
create table if not exists public.products (
  id bigint primary key,
  name text not null,
  category text not null default 'Groceries',
  quantity numeric not null default 0,
  base_unit text not null default 'kg',
  trade_unit text not null default 'bag',
  trade_unit_size numeric not null default 1,
  price numeric not null default 0,
  min_stock_threshold numeric not null default 10,
  reorder_quantity numeric not null default 5,
  supplier_name text,
  supplier_phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz default now()
);

-- 3. Create transactions table
create table if not exists public.transactions (
  id text primary key,
  timestamp timestamptz not null default now(),
  type text not null check (type in ('ADD', 'SELL', 'REMOVE', 'SET')),
  product_id bigint references public.products(id) on delete set null,
  product_name text not null,
  quantity_change numeric not null,
  trade_unit_quantity numeric not null,
  trade_unit_label text not null,
  remaining_stock_after numeric,
  price numeric,
  original_voice_text text,
  user_confirmed boolean not null default true,
  notes text
);

-- 4. Enable Row Level Security (RLS)
alter table public.products enable row level security;
alter table public.transactions enable row level security;

-- 5. Create permissive policies for public/anon access (Kirana Storekeeper MVP)
create policy "Allow public read products" on public.products for select using (true);
create policy "Allow public write products" on public.products for all using (true);

create policy "Allow public read transactions" on public.transactions for select using (true);
create policy "Allow public write transactions" on public.transactions for all using (true);

-- 6. Seed official Sai General Stores inventory
insert into public.products (id, name, category, quantity, base_unit, trade_unit, trade_unit_size, price, min_stock_threshold, reorder_quantity)
values
  (1001, 'Rice', 'Grains & Staples', 3375, 'kg', 'bag', 25, 1200, 500, 20),
  (1002, 'Sugar', 'Groceries', 50, 'kg', 'kg', 1, 45, 10, 10),
  (1003, 'Eggs', 'Dairy & Eggs', 156, 'piece', 'dozen', 12, 84, 60, 5),
  (1004, 'Oil', 'Oils & Ghee', 240, 'litre', 'carton', 12, 1800, 60, 5),
  (1005, 'Biscuits', 'Snacks & Packaged', 720, 'packet', 'box', 24, 360, 192, 8),
  (1006, 'Dal', 'Pulses & Dals', 25, 'kg', 'kg', 1, 125, 5, 5)
on conflict (id) do nothing;

-- 7. Seed initial demo sales transactions
insert into public.transactions (id, timestamp, type, product_id, product_name, quantity_change, trade_unit_quantity, trade_unit_label, remaining_stock_after, price, original_voice_text, user_confirmed)
values
  ('tx_demo_1', now() - interval '2 hours', 'SELL', 1002, 'Sugar', -10, 10, 'Kg', 40, 450, '10 kg sugar sold', true),
  ('tx_demo_2', now() - interval '45 minutes', 'SELL', 1003, 'Eggs', -60, 5, 'Dozen (12 pcs)', 96, 420, '5 dozens eggs sold', true)
on conflict (id) do nothing;
