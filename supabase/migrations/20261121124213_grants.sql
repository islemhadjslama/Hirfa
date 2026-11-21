-- =============================================================================
-- Hirfa — Migration 5 : droits (GRANT) explicites pour l'API Supabase
--
-- Les projets Supabase récents n'accordent plus automatiquement les droits sur
-- les nouvelles tables aux rôles `anon` et `authenticated`. On les accorde ici
-- au strict nécessaire : la RLS filtre ensuite les lignes.
-- Aucune écriture directe sur les tables de commande (RPC uniquement).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tables et vue
-- -----------------------------------------------------------------------------

-- Visiteurs : catalogue public uniquement
grant select on
  public.categories,
  public.artisan_profiles,
  public.products,
  public.product_images,
  public.reviews,
  public.app_settings,
  public.product_ratings
to anon;

-- Utilisateurs connectés
grant select on
  public.profiles,
  public.artisan_profiles,
  public.categories,
  public.products,
  public.product_images,
  public.favorites,
  public.orders,
  public.sub_orders,
  public.order_items,
  public.sub_order_status_history,
  public.reviews,
  public.app_settings,
  public.product_ratings
to authenticated;

grant update on public.profiles, public.artisan_profiles, public.app_settings to authenticated;
grant insert, update, delete on
  public.categories,
  public.products,
  public.product_images,
  public.reviews
to authenticated;
grant insert, delete on public.favorites to authenticated;

-- Clé secrète (script de seed) : accès complet, la RLS est contournée
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

-- -----------------------------------------------------------------------------
-- Fonctions
-- -----------------------------------------------------------------------------

-- Helpers appelés par la RLS, les triggers et les politiques Storage
grant execute on function
  public.current_user_role(),
  public.is_admin(),
  public.is_approved_artisan(),
  public.is_public_artisan(uuid),
  public.is_order_client(bigint),
  public.is_order_artisan(bigint),
  public.can_read_sub_order(bigint),
  public.has_sub_order_with_artisan(uuid),
  public.can_review_product(bigint),
  public.can_bypass_protection(),
  public.slugify(text)
to anon, authenticated;

-- RPC (déjà accordées dans la migration 2 ; répétées ici pour être explicites)
grant execute on function public.increment_product_view(bigint) to anon, authenticated;
grant execute on function
  public.place_order(jsonb, jsonb),
  public.update_sub_order_status(bigint, public.sub_order_status, text),
  public.artisan_dashboard_stats(),
  public.admin_dashboard_stats()
to authenticated;

grant execute on all functions in schema public to service_role;
