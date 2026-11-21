-- =============================================================================
-- Hirfa — Migration 1 : schéma (types, tables, contraintes, index, vue)
-- Cahier des charges §6.1 et §6.2
-- =============================================================================

create extension if not exists unaccent with schema extensions;

-- -----------------------------------------------------------------------------
-- Types énumérés
-- -----------------------------------------------------------------------------
create type public.user_role as enum ('client', 'artisan', 'admin');
create type public.artisan_status as enum ('pending', 'approved', 'rejected', 'suspended');
create type public.product_status as enum ('draft', 'published');
create type public.sub_order_status as enum (
  'pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled'
);

-- -----------------------------------------------------------------------------
-- Utilitaires utilisés par les valeurs par défaut et les triggers
-- -----------------------------------------------------------------------------

-- Met à jour la colonne updated_at, sauf si seul le compteur de vues change.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (to_jsonb(new) - 'views_count' - 'updated_at') is distinct from (to_jsonb(old) - 'views_count' - 'updated_at') then
    new.updated_at := now();
  end if;
  return new;
end;
$$;

-- « Poterie & Céramique » → « poterie-ceramique »
create or replace function public.slugify(p_value text)
returns text
language sql
stable
set search_path = public, extensions
as $$
  select trim(both '-' from regexp_replace(lower(extensions.unaccent(coalesce(p_value, ''))), '[^a-z0-9]+', '-', 'g'));
$$;

-- Numéro de commande lisible : HRF-AAAAMMJJ-00001 (RM-10)
create sequence public.order_number_seq;

create or replace function public.generate_order_number()
returns text
language sql
volatile
set search_path = public
as $$
  select 'HRF-' || to_char(now() at time zone 'Africa/Tunis', 'YYYYMMDD') || '-'
         || lpad(nextval('public.order_number_seq')::text, 5, '0');
$$;

-- -----------------------------------------------------------------------------
-- profiles — une ligne par utilisateur (créée par trigger sur auth.users)
-- -----------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  role        public.user_role not null default 'client',
  full_name   text not null default '',
  email       text,
  phone       text,
  governorate text,
  city        text,
  address     text,
  avatar_url  text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- categories
-- -----------------------------------------------------------------------------
create table public.categories (
  id          bigint generated always as identity primary key,
  name        text not null check (length(trim(name)) > 0),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text,
  image_url   text,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- artisan_profiles — créée par trigger si role = 'artisan'
-- -----------------------------------------------------------------------------
create table public.artisan_profiles (
  id                    uuid primary key references public.profiles (id) on delete cascade,
  shop_name             text not null check (length(trim(shop_name)) > 0),
  slug                  text not null unique,
  bio                   text,
  specialty_category_id bigint references public.categories (id) on delete set null,
  governorate           text,
  city                  text,
  address               text,
  logo_url              text,
  banner_url            text,
  facebook_url          text,
  instagram_url         text,
  whatsapp              text,
  status                public.artisan_status not null default 'pending',
  rejection_reason      text,
  approved_at           timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- products
-- -----------------------------------------------------------------------------
create table public.products (
  id           bigint generated always as identity primary key,
  artisan_id   uuid not null references public.artisan_profiles (id) on delete cascade,
  -- RESTRICT : impossible de supprimer une catégorie qui contient des produits (ADM-5)
  category_id  bigint not null references public.categories (id) on delete restrict,
  name         text not null check (length(trim(name)) > 0),
  slug         text not null unique,
  description  text not null default '',
  price        numeric(10, 3) not null check (price > 0),
  stock        integer not null default 0 check (stock >= 0),
  status       public.product_status not null default 'draft',
  admin_hidden boolean not null default false,
  is_featured  boolean not null default false,
  views_count  integer not null default 0 check (views_count >= 0),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- product_images
-- -----------------------------------------------------------------------------
create table public.product_images (
  id         bigint generated always as identity primary key,
  product_id bigint not null references public.products (id) on delete cascade,
  path       text not null,
  position   integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- favorites
-- -----------------------------------------------------------------------------
create table public.favorites (
  client_id  uuid not null references public.profiles (id) on delete cascade,
  product_id bigint not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (client_id, product_id)
);

-- -----------------------------------------------------------------------------
-- orders
-- -----------------------------------------------------------------------------
create table public.orders (
  id                   bigint generated always as identity primary key,
  order_number         text not null unique default public.generate_order_number(),
  client_id            uuid not null references public.profiles (id),
  shipping_full_name   text not null,
  shipping_phone       text not null,
  shipping_governorate text not null,
  shipping_city        text not null,
  shipping_address     text not null,
  notes                text,
  subtotal             numeric(10, 3) not null default 0 check (subtotal >= 0),
  shipping_total       numeric(10, 3) not null default 0 check (shipping_total >= 0),
  total                numeric(10, 3) not null default 0 check (total >= 0),
  created_at           timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- sub_orders — une par artisan et par commande (RM-3)
-- -----------------------------------------------------------------------------
create table public.sub_orders (
  id            bigint generated always as identity primary key,
  order_id      bigint not null references public.orders (id) on delete cascade,
  artisan_id    uuid not null references public.artisan_profiles (id),
  status        public.sub_order_status not null default 'pending',
  subtotal      numeric(10, 3) not null default 0 check (subtotal >= 0),
  shipping_fee  numeric(10, 3) not null default 0 check (shipping_fee >= 0),
  total         numeric(10, 3) not null default 0 check (total >= 0),
  cancel_reason text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (order_id, artisan_id)
);

-- -----------------------------------------------------------------------------
-- order_items — snapshot du nom et du prix (RM-4)
-- -----------------------------------------------------------------------------
create table public.order_items (
  id           bigint generated always as identity primary key,
  sub_order_id bigint not null references public.sub_orders (id) on delete cascade,
  product_id   bigint references public.products (id) on delete set null,
  product_name text not null,
  unit_price   numeric(10, 3) not null check (unit_price >= 0),
  quantity     integer not null check (quantity > 0),
  line_total   numeric(10, 3) not null check (line_total >= 0)
);

-- -----------------------------------------------------------------------------
-- sub_order_status_history
-- -----------------------------------------------------------------------------
create table public.sub_order_status_history (
  id           bigint generated always as identity primary key,
  sub_order_id bigint not null references public.sub_orders (id) on delete cascade,
  status       public.sub_order_status not null,
  note         text,
  changed_by   uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- reviews
-- -----------------------------------------------------------------------------
create table public.reviews (
  id         bigint generated always as identity primary key,
  product_id bigint not null references public.products (id) on delete cascade,
  client_id  uuid not null references public.profiles (id) on delete cascade,
  rating     smallint not null check (rating between 1 and 5),
  comment    text,
  is_hidden  boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, client_id)
);

-- -----------------------------------------------------------------------------
-- app_settings — une seule ligne (id = 1)
-- -----------------------------------------------------------------------------
create table public.app_settings (
  id            integer primary key default 1 check (id = 1),
  shipping_fee  numeric(10, 3) not null default 7.000 check (shipping_fee >= 0),
  site_name     text not null default 'Hirfa',
  contact_email text,
  updated_at    timestamptz not null default now()
);

-- La ligne unique est créée ici (et non seulement dans seed.sql) car
-- place_order() en a besoin pour fonctionner.
insert into public.app_settings (id) values (1) on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- Index
-- -----------------------------------------------------------------------------
create index products_artisan_id_idx on public.products (artisan_id);
create index products_category_id_idx on public.products (category_id);
create index products_status_admin_hidden_idx on public.products (status, admin_hidden);
create index product_images_product_id_idx on public.product_images (product_id, position);
create index favorites_product_id_idx on public.favorites (product_id);
create index orders_client_id_idx on public.orders (client_id);
create index sub_orders_artisan_id_status_idx on public.sub_orders (artisan_id, status);
create index order_items_sub_order_id_idx on public.order_items (sub_order_id);
create index order_items_product_id_idx on public.order_items (product_id);
create index sub_order_status_history_sub_order_id_idx on public.sub_order_status_history (sub_order_id);
create index reviews_product_id_idx on public.reviews (product_id);
create index reviews_client_id_idx on public.reviews (client_id);
create index artisan_profiles_status_idx on public.artisan_profiles (status);

-- -----------------------------------------------------------------------------
-- Triggers updated_at
-- -----------------------------------------------------------------------------
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger artisan_profiles_set_updated_at before update on public.artisan_profiles
  for each row execute function public.set_updated_at();
create trigger products_set_updated_at before update on public.products
  for each row execute function public.set_updated_at();
create trigger sub_orders_set_updated_at before update on public.sub_orders
  for each row execute function public.set_updated_at();
create trigger reviews_set_updated_at before update on public.reviews
  for each row execute function public.set_updated_at();
create trigger app_settings_set_updated_at before update on public.app_settings
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Vue product_ratings — note moyenne hors avis masqués (RM-8)
-- security_invoker : la RLS de reviews s'applique à l'utilisateur qui lit la vue.
-- -----------------------------------------------------------------------------
create view public.product_ratings
with (security_invoker = true)
as
select
  r.product_id,
  round(avg(r.rating)::numeric, 2) as avg_rating,
  count(*)::integer as reviews_count
from public.reviews r
where not r.is_hidden
group by r.product_id;
