-- =============================================================================
-- Hirfa — Migration 2 : fonctions et triggers
-- Cahier des charges §5 (règles métier) et §6.3
-- Toutes les fonctions sensibles : SECURITY DEFINER + SET search_path = public.
-- Les messages d'erreur sont en français : le frontend les affiche tels quels.
-- =============================================================================

-- =============================================================================
-- 1. Helpers utilisés par la RLS (STABLE, SECURITY DEFINER pour lire les
--    tables sans déclencher la RLS et éviter les récursions entre politiques)
-- =============================================================================

-- Rôle de l'utilisateur connecté, ou NULL s'il est anonyme ou désactivé.
-- (« current_role » est un mot réservé SQL : la fonction s'appelle current_user_role.)
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select p.role from public.profiles p where p.id = auth.uid() and p.is_active;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'admin', false);
$$;

-- Artisan connecté, actif et approuvé (RM-2).
create or replace function public.is_approved_artisan()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.artisan_profiles a
    join public.profiles p on p.id = a.id
    where a.id = auth.uid() and a.status = 'approved' and p.is_active
  );
$$;

-- Boutique visible publiquement : approuvée et compte actif (RM-1, RM-7).
create or replace function public.is_public_artisan(p_artisan_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.artisan_profiles a
    join public.profiles p on p.id = a.id
    where a.id = p_artisan_id and a.status = 'approved' and p.is_active
  );
$$;

-- L'utilisateur connecté est le client de cette commande.
create or replace function public.is_order_client(p_order_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.orders o where o.id = p_order_id and o.client_id = auth.uid()
  );
$$;

-- L'utilisateur connecté est l'artisan d'une sous-commande de cette commande.
create or replace function public.is_order_artisan(p_order_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.sub_orders s where s.order_id = p_order_id and s.artisan_id = auth.uid()
  );
$$;

-- Lecture d'une sous-commande : son client, son artisan ou un admin.
create or replace function public.can_read_sub_order(p_sub_order_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin() or exists (
    select 1
    from public.sub_orders s
    join public.orders o on o.id = s.order_id
    where s.id = p_sub_order_id
      and (s.artisan_id = auth.uid() or o.client_id = auth.uid())
  );
$$;

-- Le client connecté a au moins une sous-commande avec cet artisan.
create or replace function public.has_sub_order_with_artisan(p_artisan_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.sub_orders s
    join public.orders o on o.id = s.order_id
    where s.artisan_id = p_artisan_id and o.client_id = auth.uid()
  );
$$;

-- Le client connecté a reçu ce produit dans une sous-commande livrée (RM-8).
create or replace function public.can_review_product(p_product_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.order_items oi
    join public.sub_orders s on s.id = oi.sub_order_id
    join public.orders o on o.id = s.order_id
    where oi.product_id = p_product_id
      and s.status = 'delivered'
      and o.client_id = auth.uid()
  );
$$;

-- Vrai si la requête vient d'un contexte privilégié : SQL Editor (postgres),
-- clé secrète (service_role), fonction SECURITY DEFINER, ou admin connecté.
-- Utilisé par les triggers de protection (RM-9).
create or replace function public.can_bypass_protection()
returns boolean
language sql
stable
set search_path = public
as $$
  select current_user not in ('anon', 'authenticated') or public.is_admin();
$$;

-- =============================================================================
-- 2. Slugs
-- =============================================================================

-- Slug unique de boutique : « dar-el-fekhar », puis « dar-el-fekhar-2 »…
create or replace function public.unique_artisan_slug(p_shop_name text, p_exclude_id uuid default null)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_base text := coalesce(nullif(public.slugify(p_shop_name), ''), 'boutique');
  v_slug text := v_base;
  v_suffix integer := 1;
begin
  while exists (
    select 1 from public.artisan_profiles a
    where a.slug = v_slug and a.id is distinct from p_exclude_id
  ) loop
    v_suffix := v_suffix + 1;
    v_slug := v_base || '-' || v_suffix;
  end loop;
  return v_slug;
end;
$$;

-- =============================================================================
-- 3. Inscription : création de profiles (+ artisan_profiles)
-- =============================================================================

-- Métadonnées attendues (options.data de supabase.auth.signUp) :
--   role ('client' | 'artisan'), full_name, phone,
--   et pour un artisan : shop_name, specialty_category_id, governorate, city.
-- Le rôle 'admin' n'est JAMAIS accepté : toute autre valeur donne 'client'.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_meta        jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_role        public.user_role;
  v_full_name   text;
  v_shop_name   text;
  v_category_id bigint;
begin
  v_role := case when v_meta ->> 'role' = 'artisan' then 'artisan' else 'client' end;
  v_full_name := coalesce(nullif(trim(v_meta ->> 'full_name'), ''), split_part(new.email, '@', 1), '');

  insert into public.profiles (id, role, full_name, email, phone, governorate, city)
  values (
    new.id,
    v_role,
    v_full_name,
    new.email,
    nullif(trim(v_meta ->> 'phone'), ''),
    nullif(trim(v_meta ->> 'governorate'), ''),
    nullif(trim(v_meta ->> 'city'), '')
  );

  if v_role = 'artisan' then
    v_shop_name := coalesce(nullif(trim(v_meta ->> 'shop_name'), ''), v_full_name);

    if (v_meta ->> 'specialty_category_id') ~ '^[0-9]+$' then
      select c.id into v_category_id
      from public.categories c
      where c.id = (v_meta ->> 'specialty_category_id')::bigint;
    end if;

    insert into public.artisan_profiles (id, shop_name, slug, specialty_category_id, governorate, city)
    values (
      new.id,
      v_shop_name,
      public.unique_artisan_slug(v_shop_name),
      v_category_id,
      nullif(trim(v_meta ->> 'governorate'), ''),
      nullif(trim(v_meta ->> 'city'), '')
    );
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Garde profiles.email synchronisé avec auth.users.
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.handle_user_email_change();

-- =============================================================================
-- 4. Protection des colonnes privilégiées (RM-9)
-- =============================================================================

create or replace function public.protect_profiles_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not public.can_bypass_protection() then
    if new.role is distinct from old.role then
      raise exception 'Vous ne pouvez pas modifier votre rôle.' using errcode = '42501';
    end if;
    if new.is_active is distinct from old.is_active then
      raise exception 'Seul un administrateur peut activer ou désactiver un compte.' using errcode = '42501';
    end if;
    if new.email is distinct from old.email then
      raise exception 'L''adresse email se modifie depuis les paramètres de connexion.' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_protect_columns
  before update on public.profiles
  for each row execute function public.protect_profiles_columns();

create or replace function public.protect_artisan_profiles_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not public.can_bypass_protection() then
    -- Seule exception : l'artisan refusé peut resoumettre (rejected → pending).
    if new.status is distinct from old.status
       and not (old.status = 'rejected' and new.status = 'pending') then
      raise exception 'Seul un administrateur peut modifier le statut de la boutique.' using errcode = '42501';
    end if;
    if new.rejection_reason is distinct from old.rejection_reason
       or new.approved_at is distinct from old.approved_at then
      raise exception 'Seul un administrateur peut modifier ces informations.' using errcode = '42501';
    end if;
    if new.slug is distinct from old.slug then
      raise exception 'L''adresse de la boutique ne peut pas être modifiée.' using errcode = '42501';
    end if;
  end if;

  if new.status = 'rejected' and coalesce(trim(new.rejection_reason), '') = '' then
    raise exception 'Le motif du refus est obligatoire.' using errcode = '23514';
  end if;

  -- Ajustements automatiques
  if new.status = 'approved' and old.status is distinct from 'approved' then
    new.approved_at := now();
  end if;
  if new.status <> 'rejected' then
    new.rejection_reason := null;
  end if;

  return new;
end;
$$;

create trigger artisan_profiles_protect_columns
  before update on public.artisan_profiles
  for each row execute function public.protect_artisan_profiles_columns();

-- Produits : slug automatique, colonnes admin protégées, vues non modifiables.
create or replace function public.protect_products_columns()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_privileged boolean := public.can_bypass_protection();
begin
  if tg_op = 'INSERT' then
    if not v_privileged then
      if new.admin_hidden or new.is_featured then
        raise exception 'Seul un administrateur peut masquer ou mettre en avant un produit.' using errcode = '42501';
      end if;
      new.views_count := 0;
      new.slug := null;
    end if;
    if coalesce(new.slug, '') = '' then
      new.slug := coalesce(nullif(public.slugify(new.name), ''), 'produit') || '-'
                  || substr(md5(random()::text || clock_timestamp()::text), 1, 6);
    end if;
    return new;
  end if;

  -- UPDATE
  if not v_privileged then
    if new.admin_hidden is distinct from old.admin_hidden
       or new.is_featured is distinct from old.is_featured then
      raise exception 'Seul un administrateur peut masquer ou mettre en avant un produit.' using errcode = '42501';
    end if;
    if new.artisan_id is distinct from old.artisan_id then
      raise exception 'Le propriétaire d''un produit ne peut pas être modifié.' using errcode = '42501';
    end if;
    new.views_count := old.views_count;
    new.slug := old.slug;
  end if;
  return new;
end;
$$;

create trigger products_protect_columns
  before insert or update on public.products
  for each row execute function public.protect_products_columns();

-- ART-5 : un produit déjà commandé ne se supprime pas, il passe en brouillon.
create or replace function public.prevent_ordered_product_delete()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not public.can_bypass_protection()
     and exists (select 1 from public.order_items oi where oi.product_id = old.id) then
    raise exception 'Ce produit a déjà été commandé : il ne peut pas être supprimé. Passez-le en brouillon.'
      using errcode = '23503';
  end if;
  return old;
end;
$$;

create trigger products_prevent_ordered_delete
  before delete on public.products
  for each row execute function public.prevent_ordered_product_delete();

-- ART-4 : 5 images maximum par produit.
create or replace function public.limit_product_images()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (select count(*) from public.product_images pi where pi.product_id = new.product_id) >= 5 then
    raise exception 'Un produit ne peut pas avoir plus de 5 images.' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger product_images_limit
  before insert on public.product_images
  for each row execute function public.limit_product_images();

-- Avis : seul l'admin masque un avis ; produit et auteur non modifiables.
create or replace function public.protect_reviews_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if public.can_bypass_protection() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.is_hidden := false;
    return new;
  end if;

  if new.is_hidden is distinct from old.is_hidden then
    raise exception 'Seul un administrateur peut masquer un avis.' using errcode = '42501';
  end if;
  if new.product_id is distinct from old.product_id or new.client_id is distinct from old.client_id then
    raise exception 'Le produit et l''auteur d''un avis ne peuvent pas être modifiés.' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger reviews_protect_columns
  before insert or update on public.reviews
  for each row execute function public.protect_reviews_columns();

-- ADM-5 : message clair si la catégorie contient des produits.
create or replace function public.prevent_used_category_delete()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if exists (select 1 from public.products p where p.category_id = old.id) then
    raise exception 'Impossible de supprimer une catégorie qui contient des produits : désactivez-la.'
      using errcode = '23503';
  end if;
  return old;
end;
$$;

create trigger categories_prevent_used_delete
  before delete on public.categories
  for each row execute function public.prevent_used_category_delete();

-- =============================================================================
-- 5. RPC place_order (PAN-5, RM-3, RM-4, RM-5)
-- =============================================================================
-- p_items    : [{"product_id": 12, "quantity": 2}, ...]
-- p_shipping : {"full_name", "phone", "governorate", "city", "address", "notes"?}
-- Retourne orders.id. Tout est fait dans une seule transaction : en cas
-- d'erreur, rien n'est créé et le stock n'est pas touché.
create or replace function public.place_order(p_items jsonb, p_shipping jsonb)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid          uuid := auth.uid();
  v_profile      public.profiles%rowtype;
  v_lines        jsonb;
  v_line         record;
  v_product      record;
  v_fee          numeric(10, 3);
  v_order_id     bigint;
  v_sub_order_id bigint;
  v_artisan_id   uuid;
  v_full_name    text := trim(coalesce(p_shipping ->> 'full_name', ''));
  v_phone        text := regexp_replace(coalesce(p_shipping ->> 'phone', ''), '[\s.-]', '', 'g');
  v_governorate  text := trim(coalesce(p_shipping ->> 'governorate', ''));
  v_city         text := trim(coalesce(p_shipping ->> 'city', ''));
  v_address      text := trim(coalesce(p_shipping ->> 'address', ''));
  v_notes        text := nullif(trim(coalesce(p_shipping ->> 'notes', '')), '');
begin
  -- Appelant : client actif (RM-7)
  if v_uid is null then
    raise exception 'Vous devez être connecté pour commander.' using errcode = '42501';
  end if;
  select * into v_profile from public.profiles where id = v_uid;
  if not found or v_profile.role <> 'client' then
    raise exception 'Seuls les clients peuvent commander.' using errcode = '42501';
  end if;
  if not v_profile.is_active then
    raise exception 'Votre compte a été désactivé. Contactez l''administrateur.' using errcode = '42501';
  end if;

  -- Livraison
  if v_full_name = '' or v_governorate = '' or v_city = '' or v_address = '' then
    raise exception 'Adresse de livraison incomplète.' using errcode = '22023';
  end if;
  if v_phone !~ '^[0-9]{8}$' then
    raise exception 'Le numéro de téléphone doit contenir 8 chiffres.' using errcode = '22023';
  end if;

  -- Articles : tableau non vide, quantités entières positives
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Votre panier est vide.' using errcode = '22023';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_items) e
    where jsonb_typeof(e -> 'product_id') <> 'number'
       or jsonb_typeof(e -> 'quantity') <> 'number'
       or (e ->> 'quantity') !~ '^[0-9]+$'
       or (e ->> 'quantity')::integer <= 0
  ) then
    raise exception 'Panier invalide : quantités incorrectes.' using errcode = '22023';
  end if;

  -- Regroupe les doublons éventuels d'un même produit
  select jsonb_agg(jsonb_build_object('product_id', l.product_id, 'quantity', l.quantity) order by l.product_id)
  into v_lines
  from (
    select (e ->> 'product_id')::bigint as product_id, sum((e ->> 'quantity')::integer) as quantity
    from jsonb_array_elements(p_items) e
    group by 1
  ) l;

  -- Verrouille les produits (ordre stable pour éviter les interblocages)
  -- puis vérifie visibilité (RM-1) et stock (RM-5).
  for v_line in
    select * from jsonb_to_recordset(v_lines) as l(product_id bigint, quantity integer) order by l.product_id
  loop
    select p.id, p.name, p.stock, p.status, p.admin_hidden, p.artisan_id
    into v_product
    from public.products p
    where p.id = v_line.product_id
    for update;

    if not found then
      raise exception 'Un produit de votre panier n''existe plus.' using errcode = 'P0001';
    end if;
    if v_product.status <> 'published' or v_product.admin_hidden
       or not public.is_public_artisan(v_product.artisan_id) then
      raise exception 'Le produit « % » n''est plus disponible.', v_product.name using errcode = 'P0001';
    end if;
    if v_product.stock < v_line.quantity then
      if v_product.stock = 0 then
        raise exception 'Le produit « % » est en rupture de stock.', v_product.name using errcode = 'P0001';
      end if;
      raise exception 'Stock insuffisant pour « % » : % disponible(s).', v_product.name, v_product.stock
        using errcode = 'P0001';
    end if;
  end loop;

  select s.shipping_fee into v_fee from public.app_settings s where s.id = 1;
  v_fee := coalesce(v_fee, 0);

  insert into public.orders (
    client_id, shipping_full_name, shipping_phone, shipping_governorate,
    shipping_city, shipping_address, notes
  )
  values (v_uid, v_full_name, v_phone, v_governorate, v_city, v_address, v_notes)
  returning id into v_order_id;

  -- Une sous-commande par artisan (RM-3)
  for v_artisan_id in
    select distinct p.artisan_id
    from jsonb_to_recordset(v_lines) as l(product_id bigint, quantity integer)
    join public.products p on p.id = l.product_id
  loop
    insert into public.sub_orders (order_id, artisan_id, shipping_fee)
    values (v_order_id, v_artisan_id, v_fee)
    returning id into v_sub_order_id;

    -- Snapshot nom + prix (RM-4)
    insert into public.order_items (sub_order_id, product_id, product_name, unit_price, quantity, line_total)
    select v_sub_order_id, p.id, p.name, p.price, l.quantity, p.price * l.quantity
    from jsonb_to_recordset(v_lines) as l(product_id bigint, quantity integer)
    join public.products p on p.id = l.product_id
    where p.artisan_id = v_artisan_id;

    update public.sub_orders s
    set subtotal = t.subtotal,
        total = t.subtotal + s.shipping_fee
    from (
      select coalesce(sum(oi.line_total), 0) as subtotal
      from public.order_items oi
      where oi.sub_order_id = v_sub_order_id
    ) t
    where s.id = v_sub_order_id;

    insert into public.sub_order_status_history (sub_order_id, status, note, changed_by)
    values (v_sub_order_id, 'pending', 'Commande passée', v_uid);
  end loop;

  -- Décrémente le stock (RM-5)
  update public.products p
  set stock = p.stock - l.quantity
  from jsonb_to_recordset(v_lines) as l(product_id bigint, quantity integer)
  where p.id = l.product_id;

  -- Totaux de la commande : total = Σ sous-commandes
  update public.orders o
  set subtotal = t.subtotal,
      shipping_total = t.shipping_total,
      total = t.total
  from (
    select sum(s.subtotal) as subtotal, sum(s.shipping_fee) as shipping_total, sum(s.total) as total
    from public.sub_orders s
    where s.order_id = v_order_id
  ) t
  where o.id = v_order_id;

  return v_order_id;
end;
$$;

-- =============================================================================
-- 6. RPC update_sub_order_status (RM-6, RM-5)
-- =============================================================================
create or replace function public.update_sub_order_status(
  p_sub_order_id bigint,
  p_status public.sub_order_status,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid       uuid := auth.uid();
  v_profile   public.profiles%rowtype;
  v_sub_order public.sub_orders%rowtype;
  v_client_id uuid;
  v_note      text := nullif(trim(coalesce(p_note, '')), '');
  v_actor     text;
  v_next      public.sub_order_status;
begin
  if v_uid is null then
    raise exception 'Vous devez être connecté.' using errcode = '42501';
  end if;
  select * into v_profile from public.profiles where id = v_uid;
  if not found or not v_profile.is_active then
    raise exception 'Votre compte a été désactivé. Contactez l''administrateur.' using errcode = '42501';
  end if;

  select * into v_sub_order from public.sub_orders where id = p_sub_order_id for update;
  if not found then
    raise exception 'Sous-commande introuvable.' using errcode = 'P0002';
  end if;
  select o.client_id into v_client_id from public.orders o where o.id = v_sub_order.order_id;

  if v_profile.role = 'admin' then
    v_actor := 'admin';
  elsif v_profile.role = 'artisan' and v_sub_order.artisan_id = v_uid then
    v_actor := 'artisan';
  elsif v_profile.role = 'client' and v_client_id = v_uid then
    v_actor := 'client';
  else
    raise exception 'Vous n''avez pas accès à cette commande.' using errcode = '42501';
  end if;

  if p_status = v_sub_order.status then
    raise exception 'La commande est déjà dans ce statut.' using errcode = 'P0001';
  end if;
  -- delivered et cancelled sont des statuts finaux, pour tout le monde
  if v_sub_order.status in ('delivered', 'cancelled') then
    raise exception 'Cette commande est terminée : son statut ne peut plus changer.' using errcode = 'P0001';
  end if;

  if v_actor = 'client' then
    if not (v_sub_order.status = 'pending' and p_status = 'cancelled') then
      raise exception 'Vous ne pouvez annuler une commande que tant qu''elle est en attente.' using errcode = '42501';
    end if;
  elsif v_actor = 'artisan' then
    if p_status = 'cancelled' then
      if v_sub_order.status not in ('pending', 'confirmed', 'preparing') then
        raise exception 'Une commande expédiée ne peut plus être annulée.' using errcode = '42501';
      end if;
      if v_note is null then
        raise exception 'Le motif d''annulation est obligatoire.' using errcode = '22023';
      end if;
    else
      v_next := case v_sub_order.status
        when 'pending' then 'confirmed'
        when 'confirmed' then 'preparing'
        when 'preparing' then 'shipped'
        when 'shipped' then 'delivered'
      end;
      if p_status is distinct from v_next then
        raise exception 'Transition de statut non autorisée.' using errcode = '42501';
      end if;
    end if;
  end if;
  -- admin : toute transition depuis un statut non final

  if p_status = 'cancelled' then
    -- Restaure le stock (RM-5) ; les produits supprimés sont ignorés
    update public.products p
    set stock = p.stock + oi.quantity
    from public.order_items oi
    where oi.sub_order_id = v_sub_order.id and oi.product_id = p.id;
  end if;

  update public.sub_orders
  set status = p_status,
      cancel_reason = case when p_status = 'cancelled' then v_note else cancel_reason end
  where id = v_sub_order.id;

  insert into public.sub_order_status_history (sub_order_id, status, note, changed_by)
  values (v_sub_order.id, p_status, v_note, v_uid);
end;
$$;

-- =============================================================================
-- 7. Compteur de vues (CAT-6)
-- =============================================================================
create or replace function public.increment_product_view(p_product_id bigint)
returns void
language sql
security definer
set search_path = public
as $$
  update public.products p
  set views_count = p.views_count + 1
  where p.id = p_product_id
    and p.artisan_id is distinct from auth.uid()
    and p.status = 'published'
    and not p.admin_hidden
    and public.is_public_artisan(p.artisan_id);
$$;

-- =============================================================================
-- 8. Statistiques des tableaux de bord
-- =============================================================================

-- ART-8 : indicateurs de l'artisan connecté.
create or replace function public.artisan_dashboard_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_result jsonb;
begin
  if not exists (
    select 1 from public.artisan_profiles a join public.profiles p on p.id = a.id
    where a.id = v_uid and p.is_active
  ) then
    raise exception 'Accès réservé aux artisans.' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'revenue', (
      select coalesce(sum(s.total), 0) from public.sub_orders s
      where s.artisan_id = v_uid and s.status = 'delivered'
    ),
    'pending_orders', (
      select count(*) from public.sub_orders s
      where s.artisan_id = v_uid and s.status = 'pending'
    ),
    'published_products', (
      select count(*) from public.products p
      where p.artisan_id = v_uid and p.status = 'published'
    ),
    'avg_rating', (
      select round(avg(r.rating)::numeric, 2)
      from public.reviews r join public.products p on p.id = r.product_id
      where p.artisan_id = v_uid and not r.is_hidden
    ),
    'reviews_count', (
      select count(*)
      from public.reviews r join public.products p on p.id = r.product_id
      where p.artisan_id = v_uid and not r.is_hidden
    ),
    'sales_by_month', (
      select jsonb_agg(
        jsonb_build_object(
          'month', to_char(m.month, 'YYYY-MM'),
          'revenue', coalesce(x.revenue, 0),
          'orders', coalesce(x.orders, 0)
        ) order by m.month
      )
      from generate_series(
        date_trunc('month', now()) - interval '5 months',
        date_trunc('month', now()),
        interval '1 month'
      ) as m(month)
      left join lateral (
        select
          sum(s.total) filter (where s.status = 'delivered') as revenue,
          count(*) filter (where s.status <> 'cancelled') as orders
        from public.sub_orders s
        where s.artisan_id = v_uid
          and s.created_at >= m.month
          and s.created_at < m.month + interval '1 month'
      ) x on true
    ),
    'top_products', (
      select coalesce(jsonb_agg(t order by t.quantity desc), '[]'::jsonb)
      from (
        select oi.product_id, max(oi.product_name) as name,
               sum(oi.quantity)::integer as quantity, sum(oi.line_total) as revenue
        from public.order_items oi
        join public.sub_orders s on s.id = oi.sub_order_id
        where s.artisan_id = v_uid and s.status <> 'cancelled'
        group by oi.product_id
        order by sum(oi.quantity) desc
        limit 5
      ) t
    ),
    'recent_orders', (
      select coalesce(jsonb_agg(r order by r.created_at desc), '[]'::jsonb)
      from (
        select s.id, o.order_number, s.created_at, s.status, s.total,
               o.shipping_full_name as client_name
        from public.sub_orders s
        join public.orders o on o.id = s.order_id
        where s.artisan_id = v_uid
        order by s.created_at desc
        limit 5
      ) r
    )
  ) into v_result;

  return v_result;
end;
$$;

-- ADM-1 : indicateurs globaux (admin uniquement).
create or replace function public.admin_dashboard_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  if not public.is_admin() then
    raise exception 'Accès réservé aux administrateurs.' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'clients', (select count(*) from public.profiles where role = 'client'),
    'artisans', (
      select jsonb_build_object(
        'total', count(*),
        'pending', count(*) filter (where status = 'pending'),
        'approved', count(*) filter (where status = 'approved'),
        'rejected', count(*) filter (where status = 'rejected'),
        'suspended', count(*) filter (where status = 'suspended')
      )
      from public.artisan_profiles
    ),
    'products', (select count(*) from public.products),
    'orders', (select count(*) from public.orders),
    'revenue', (
      select coalesce(sum(s.total), 0) from public.sub_orders s where s.status = 'delivered'
    ),
    'orders_by_month', (
      select jsonb_agg(
        jsonb_build_object('month', to_char(m.month, 'YYYY-MM'), 'orders', coalesce(x.orders, 0))
        order by m.month
      )
      from generate_series(
        date_trunc('month', now()) - interval '5 months',
        date_trunc('month', now()),
        interval '1 month'
      ) as m(month)
      left join lateral (
        select count(*) as orders
        from public.orders o
        where o.created_at >= m.month and o.created_at < m.month + interval '1 month'
      ) x on true
    ),
    'pending_artisans', (
      select coalesce(jsonb_agg(a order by a.created_at), '[]'::jsonb)
      from (
        select ap.id, ap.shop_name, ap.slug, ap.governorate, ap.created_at,
               p.full_name, p.email
        from public.artisan_profiles ap
        join public.profiles p on p.id = ap.id
        where ap.status = 'pending'
        order by ap.created_at
        limit 10
      ) a
    )
  ) into v_result;

  return v_result;
end;
$$;

-- =============================================================================
-- 9. Droits d'exécution
-- Supabase accorde EXECUTE à anon et authenticated par défaut : on restreint.
-- =============================================================================
revoke execute on function public.place_order(jsonb, jsonb) from public, anon;
revoke execute on function public.update_sub_order_status(bigint, public.sub_order_status, text) from public, anon;
revoke execute on function public.artisan_dashboard_stats() from public, anon;
revoke execute on function public.admin_dashboard_stats() from public, anon;
revoke execute on function public.generate_order_number() from public, anon, authenticated;
revoke execute on function public.unique_artisan_slug(text, uuid) from public, anon, authenticated;

grant execute on function public.place_order(jsonb, jsonb) to authenticated;
grant execute on function public.update_sub_order_status(bigint, public.sub_order_status, text) to authenticated;
grant execute on function public.artisan_dashboard_stats() to authenticated;
grant execute on function public.admin_dashboard_stats() to authenticated;
grant execute on function public.increment_product_view(bigint) to anon, authenticated;
