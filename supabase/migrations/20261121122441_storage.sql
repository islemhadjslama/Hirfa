-- =============================================================================
-- Hirfa — Migration 4 : Storage (cahier des charges §6.5)
-- Buckets publics en lecture. Écriture limitée au dossier {auth.uid()}/…
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('product-images',  'product-images',  true, 2097152, array['image/jpeg', 'image/png', 'image/webp']),
  ('shop-assets',     'shop-assets',     true, 2097152, array['image/jpeg', 'image/png', 'image/webp']),
  ('category-images', 'category-images', true, 2097152, array['image/jpeg', 'image/png', 'image/webp']),
  ('avatars',         'avatars',         true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Lecture (nécessaire pour lister et pour l'upsert ; les URL publiques
-- fonctionnent sans politique).
create policy "storage: lecture des buckets Hirfa"
  on storage.objects for select
  using (bucket_id in ('product-images', 'shop-assets', 'category-images', 'avatars'));

-- -----------------------------------------------------------------------------
-- product-images : artisan approuvé, dans son dossier ; admin peut supprimer
-- -----------------------------------------------------------------------------
create policy "storage product-images: ajout artisan approuvé"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.is_approved_artisan()
  );

create policy "storage product-images: modification artisan approuvé"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.is_approved_artisan()
  )
  with check (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.is_approved_artisan()
  );

create policy "storage product-images: suppression artisan approuvé ou admin"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'product-images'
    and (
      ((storage.foldername(name))[1] = (select auth.uid())::text and public.is_approved_artisan())
      or public.is_admin()
    )
  );

-- -----------------------------------------------------------------------------
-- shop-assets (logo, bannière) : tout artisan (même non approuvé, cf. ART-1)
-- -----------------------------------------------------------------------------
create policy "storage shop-assets: ajout artisan"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'shop-assets'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.current_user_role() = 'artisan'
  );

create policy "storage shop-assets: modification artisan"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'shop-assets'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.current_user_role() = 'artisan'
  )
  with check (
    bucket_id = 'shop-assets'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.current_user_role() = 'artisan'
  );

create policy "storage shop-assets: suppression artisan ou admin"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'shop-assets'
    and (
      ((storage.foldername(name))[1] = (select auth.uid())::text and public.current_user_role() = 'artisan')
      or public.is_admin()
    )
  );

-- -----------------------------------------------------------------------------
-- category-images : admin
-- -----------------------------------------------------------------------------
create policy "storage category-images: ajout admin"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'category-images' and public.is_admin());

create policy "storage category-images: modification admin"
  on storage.objects for update to authenticated
  using (bucket_id = 'category-images' and public.is_admin())
  with check (bucket_id = 'category-images' and public.is_admin());

create policy "storage category-images: suppression admin"
  on storage.objects for delete to authenticated
  using (bucket_id = 'category-images' and public.is_admin());

-- -----------------------------------------------------------------------------
-- avatars : chaque utilisateur dans son dossier
-- -----------------------------------------------------------------------------
create policy "storage avatars: ajout dans son dossier"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "storage avatars: modification dans son dossier"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "storage avatars: suppression dans son dossier"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
