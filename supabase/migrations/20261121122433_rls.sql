-- =============================================================================
-- Hirfa — Migration 3 : Row Level Security (cahier des charges §6.4)
-- RLS activée sur TOUTES les tables. Aucune écriture directe sur les tables de
-- commande : uniquement via les RPC place_order et update_sub_order_status.
-- `(select auth.uid())` : évalué une seule fois par requête (recommandation Supabase).
-- =============================================================================

alter table public.profiles                 enable row level security;
alter table public.artisan_profiles         enable row level security;
alter table public.categories               enable row level security;
alter table public.products                 enable row level security;
alter table public.product_images           enable row level security;
alter table public.favorites                enable row level security;
alter table public.orders                   enable row level security;
alter table public.sub_orders               enable row level security;
alter table public.order_items              enable row level security;
alter table public.sub_order_status_history enable row level security;
alter table public.reviews                  enable row level security;
alter table public.app_settings             enable row level security;

-- -----------------------------------------------------------------------------
-- profiles : soi-même ; admin. Pas d'INSERT (trigger handle_new_user).
-- -----------------------------------------------------------------------------
create policy "profiles: lecture soi-même ou admin"
  on public.profiles for select
  using (id = (select auth.uid()) or public.is_admin());

create policy "profiles: modification soi-même ou admin"
  on public.profiles for update
  using (id = (select auth.uid()) or public.is_admin())
  with check (id = (select auth.uid()) or public.is_admin());

-- -----------------------------------------------------------------------------
-- artisan_profiles
-- -----------------------------------------------------------------------------
create policy "artisan_profiles: lecture publique, soi-même, clients liés, admin"
  on public.artisan_profiles for select
  using (
    public.is_public_artisan(id)
    or id = (select auth.uid())
    or public.has_sub_order_with_artisan(id)
    or public.is_admin()
  );

create policy "artisan_profiles: modification soi-même ou admin"
  on public.artisan_profiles for update
  using (id = (select auth.uid()) or public.is_admin())
  with check (id = (select auth.uid()) or public.is_admin());

-- -----------------------------------------------------------------------------
-- categories : lecture publique des actives ; écriture admin
-- -----------------------------------------------------------------------------
create policy "categories: lecture des actives ou admin"
  on public.categories for select
  using (is_active or public.is_admin());

create policy "categories: création admin"
  on public.categories for insert
  with check (public.is_admin());

create policy "categories: modification admin"
  on public.categories for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "categories: suppression admin"
  on public.categories for delete
  using (public.is_admin());

-- -----------------------------------------------------------------------------
-- products : public si RM-1 ; propriétaire ; admin
-- -----------------------------------------------------------------------------
create policy "products: lecture visible, propriétaire ou admin"
  on public.products for select
  using (
    (status = 'published' and not admin_hidden and public.is_public_artisan(artisan_id))
    or artisan_id = (select auth.uid())
    or public.is_admin()
  );

create policy "products: création artisan approuvé ou admin"
  on public.products for insert
  with check (
    (artisan_id = (select auth.uid()) and public.is_approved_artisan())
    or public.is_admin()
  );

create policy "products: modification artisan approuvé ou admin"
  on public.products for update
  using (
    (artisan_id = (select auth.uid()) and public.is_approved_artisan())
    or public.is_admin()
  )
  with check (
    (artisan_id = (select auth.uid()) and public.is_approved_artisan())
    or public.is_admin()
  );

create policy "products: suppression artisan approuvé ou admin"
  on public.products for delete
  using (
    (artisan_id = (select auth.uid()) and public.is_approved_artisan())
    or public.is_admin()
  );

-- -----------------------------------------------------------------------------
-- product_images : lisibles si le produit l'est (RLS de products appliquée)
-- -----------------------------------------------------------------------------
create policy "product_images: lecture si le produit est visible"
  on public.product_images for select
  using (exists (select 1 from public.products p where p.id = product_id));

create policy "product_images: création propriétaire approuvé ou admin"
  on public.product_images for insert
  with check (
    public.is_admin()
    or (
      public.is_approved_artisan()
      and exists (
        select 1 from public.products p
        where p.id = product_id and p.artisan_id = (select auth.uid())
      )
    )
  );

create policy "product_images: modification propriétaire approuvé ou admin"
  on public.product_images for update
  using (
    public.is_admin()
    or (
      public.is_approved_artisan()
      and exists (
        select 1 from public.products p
        where p.id = product_id and p.artisan_id = (select auth.uid())
      )
    )
  )
  with check (
    public.is_admin()
    or (
      public.is_approved_artisan()
      and exists (
        select 1 from public.products p
        where p.id = product_id and p.artisan_id = (select auth.uid())
      )
    )
  );

create policy "product_images: suppression propriétaire approuvé ou admin"
  on public.product_images for delete
  using (
    public.is_admin()
    or (
      public.is_approved_artisan()
      and exists (
        select 1 from public.products p
        where p.id = product_id and p.artisan_id = (select auth.uid())
      )
    )
  );

-- -----------------------------------------------------------------------------
-- favorites : uniquement les siens (client)
-- -----------------------------------------------------------------------------
create policy "favorites: lecture des siens"
  on public.favorites for select
  using (client_id = (select auth.uid()));

create policy "favorites: ajout par le client"
  on public.favorites for insert
  with check (client_id = (select auth.uid()) and public.current_user_role() = 'client');

create policy "favorites: retrait des siens"
  on public.favorites for delete
  using (client_id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- Commandes : LECTURE seule. Aucune politique INSERT/UPDATE/DELETE :
-- toute écriture passe par les RPC (SECURITY DEFINER).
-- -----------------------------------------------------------------------------
create policy "orders: lecture client, artisans concernés, admin"
  on public.orders for select
  using (
    client_id = (select auth.uid())
    or public.is_order_artisan(id)
    or public.is_admin()
  );

create policy "sub_orders: lecture client, artisan concerné, admin"
  on public.sub_orders for select
  using (
    artisan_id = (select auth.uid())
    or public.is_order_client(order_id)
    or public.is_admin()
  );

create policy "order_items: lecture si la sous-commande est lisible"
  on public.order_items for select
  using (public.can_read_sub_order(sub_order_id));

create policy "sub_order_status_history: lecture si la sous-commande est lisible"
  on public.sub_order_status_history for select
  using (public.can_read_sub_order(sub_order_id));

-- -----------------------------------------------------------------------------
-- reviews (RM-8)
-- -----------------------------------------------------------------------------
create policy "reviews: lecture des visibles, auteur ou admin"
  on public.reviews for select
  using (not is_hidden or client_id = (select auth.uid()) or public.is_admin());

create policy "reviews: création par un client éligible"
  on public.reviews for insert
  with check (
    client_id = (select auth.uid())
    and public.current_user_role() = 'client'
    and public.can_review_product(product_id)
  );

create policy "reviews: modification auteur ou admin"
  on public.reviews for update
  using (client_id = (select auth.uid()) or public.is_admin())
  with check (client_id = (select auth.uid()) or public.is_admin());

create policy "reviews: suppression auteur ou admin"
  on public.reviews for delete
  using (client_id = (select auth.uid()) or public.is_admin());

-- -----------------------------------------------------------------------------
-- app_settings : lecture publique ; modification admin
-- -----------------------------------------------------------------------------
create policy "app_settings: lecture publique"
  on public.app_settings for select
  using (true);

create policy "app_settings: modification admin"
  on public.app_settings for update
  using (public.is_admin())
  with check (public.is_admin());
