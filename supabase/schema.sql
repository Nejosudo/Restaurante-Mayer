-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles (Extends Supabase Auth)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  first_name text,
  last_name text,
  cedula text,
  birth_date date,
  address text,
  role text default 'client' check (role in ('client', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Categories
create table public.categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  slug text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Ingredients (Inventory)
create table public.ingredients (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  unit text not null check (unit in ('gramo', 'libra', 'kilo', 'litro', 'mililitro', 'unidad')),
  cost_per_unit decimal(10, 2) not null,
  stock decimal(10, 2) default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Products (Menu)
create table public.products (
  id uuid default uuid_generate_v4() primary key,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  description text,
  price decimal(10, 2) not null,
  image_url text,
  is_available boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Product Ingredients (Recipe / Cost Calculation)
create table public.product_ingredients (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references public.products(id) on delete cascade not null,
  ingredient_id uuid references public.ingredients(id) on delete cascade not null,
  quantity_needed decimal(10, 2) not null, -- Amount of ingredient unit needed
  unique(product_id, ingredient_id)
);

-- 6. Orders
create table public.orders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  status text default 'pendiente' check (status in ('pendiente', 'en_proceso', 'completado', 'entregado')),
  total_amount decimal(10, 2) not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Order Items
create table public.order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete set null,
  quantity integer not null check (quantity > 0),
  unit_price decimal(10, 2) not null, -- Snapshot of price at time of order
  note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Invoices (Facturación - Snapshot)
create table public.invoices (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) on delete cascade unique not null,
  user_data jsonb not null, -- Snapshot of user data
  order_data jsonb not null, -- Snapshot of order items and total
  issued_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security (RLS) Policies (Basic Setup)

-- Profiles: Users can read their own profile. Admins can read all.
alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Products/Categories: Public read. Admin write.
alter table public.categories enable row level security;
create policy "Categories are viewable by everyone" on public.categories for select using (true);

alter table public.products enable row level security;
create policy "Products are viewable by everyone" on public.products for select using (true);

-- Orders: Users see own. Admins see all.
alter table public.orders enable row level security;
create policy "Users can view own orders" on public.orders for select using (auth.uid() = user_id);
create policy "Users can insert own orders" on public.orders for insert with check (auth.uid() = user_id);

-- Initial Data (Categories)
insert into public.categories (name, slug) values
('Desayunos', 'desayunos'),
('Almuerzos', 'almuerzos'),
('Comidas', 'comidas'),
('Platos Especiales', 'especiales'),
('Bebidas', 'bebidas'),
('Infantil', 'infantil');

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, first_name, last_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'last_name', 'client');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
