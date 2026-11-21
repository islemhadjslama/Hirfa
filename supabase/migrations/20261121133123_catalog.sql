-- =============================================================================
-- Hirfa — Migration 6 : catalogue public (Phase 4)
--
-- 1. Vue `catalog_products` : produits visibles (RM-1) avec image principale,
--    note moyenne et texte de recherche sans accents. Permet de trier par note
--    (CAT-4) et de rechercher « ceramique » → « céramique » (CAT-3).
-- 2. Fonction `product_reviews` : avis visibles d'un produit avec un nom
--    d'auteur abrégé (« Amira B. »), sans exposer la table profiles.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Vue du catalogue
-- security_invoker : la RLS des tables sous-jacentes s'applique à l'appelant.
-- La clause WHERE applique RM-1 pour TOUS les rôles (y compris admin et
-- artisan propriétaire, qui voient sinon leurs brouillons via la RLS).
-- Une catégorie désactivée retire ses produits du catalogue.
-- -----------------------------------------------------------------------------
create view public.catalog_products
with (security_invoker = true)
as
select
  p.id,
  p.name,
  p.slug,
  p.description,
  p.price,
  p.stock,
  p.is_featured,
  p.created_at,
  p.category_id,
  c.slug                          as category_slug,
  c.name                          as category_name,
  p.artisan_id,
  a.slug                          as artisan_slug,
  a.shop_name                     as artisan_name,
  a.governorate                   as artisan_governorate,
  a.city                          as artisan_city,
  coalesce(r.avg_rating, 0)::numeric(3, 2) as avg_rating,
  coalesce(r.reviews_count, 0)    as reviews_count,
  (
    select pi.path
    from public.product_images pi
    where pi.product_id = p.id
    order by pi.position, pi.id
    limit 1
  )                               as image_path,
  lower(extensions.unaccent(p.name || ' ' || p.description)) as search_text
from public.products p
join public.artisan_profiles a on a.id = p.artisan_id
join public.categories c on c.id = p.category_id
left join public.product_ratings r on r.product_id = p.id
where p.status = 'published'
  and not p.admin_hidden
  and c.is_active
  and public.is_public_artisan(p.artisan_id);

grant select on public.catalog_products to anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 2. Avis publics d'un produit (CAT-6)
-- -----------------------------------------------------------------------------
create or replace function public.product_reviews(p_product_id bigint)
returns table (
  id bigint,
  rating smallint,
  comment text,
  created_at timestamptz,
  updated_at timestamptz,
  author_name text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    r.id,
    r.rating,
    r.comment,
    r.created_at,
    r.updated_at,
    case
      when coalesce(array_length(n.parts, 1), 0) = 0 or n.parts[1] = '' then 'Client'
      when array_length(n.parts, 1) = 1 then n.parts[1]
      else n.parts[1] || ' ' || upper(left(n.parts[array_length(n.parts, 1)], 1)) || '.'
    end as author_name
  from public.reviews r
  join public.profiles pr on pr.id = r.client_id
  cross join lateral (select regexp_split_to_array(trim(pr.full_name), '\s+') as parts) n
  where r.product_id = p_product_id
    and not r.is_hidden
  order by r.created_at desc;
$$;

revoke execute on function public.product_reviews(bigint) from public;
grant execute on function public.product_reviews(bigint) to anon, authenticated, service_role;
