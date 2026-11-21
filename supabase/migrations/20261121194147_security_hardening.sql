-- =============================================================================
-- Hirfa — Migration 7 : durcissement (revue de sécurité RLS, Phase 9)
--
-- 1. product_images : un artisan ne peut référencer que SES fichiers
--    (chemin « {uid}/{product_id}/… »), pas l'image d'un autre artisan.
-- 2. Storage : la lecture des objets via l'API (listing) est limitée au dossier
--    de l'utilisateur (ou à l'admin). Les URL publiques des buckets publics ne
--    passent pas par la RLS et restent accessibles à tous.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. product_images : chemin cohérent avec le propriétaire et le produit
-- -----------------------------------------------------------------------------
create or replace function public.is_own_product_image_path(p_product_id bigint, p_path text)
returns boolean
language sql
immutable
set search_path = public
as $$
  select split_part(p_path, '/', 1) = (select auth.uid())::text
     and split_part(p_path, '/', 2) = p_product_id::text
     and split_part(p_path, '/', 3) <> '';
$$;

grant execute on function public.is_own_product_image_path(bigint, text) to anon, authenticated, service_role;

drop policy "product_images: création propriétaire approuvé ou admin" on public.product_images;
drop policy "product_images: modification propriétaire approuvé ou admin" on public.product_images;

create policy "product_images: création propriétaire approuvé ou admin"
  on public.product_images for insert
  with check (
    public.is_admin()
    or (
      public.is_approved_artisan()
      and public.is_own_product_image_path(product_id, path)
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
      and public.is_own_product_image_path(product_id, path)
      and exists (
        select 1 from public.products p
        where p.id = product_id and p.artisan_id = (select auth.uid())
      )
    )
  );

-- -----------------------------------------------------------------------------
-- 2. Storage : pas de listing public des fichiers
-- -----------------------------------------------------------------------------
drop policy "storage: lecture des buckets Hirfa" on storage.objects;

create policy "storage: lecture de ses fichiers (ou admin)"
  on storage.objects for select to authenticated
  using (
    bucket_id in ('product-images', 'shop-assets', 'category-images', 'avatars')
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or public.is_admin()
    )
  );
