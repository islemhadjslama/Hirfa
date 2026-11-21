-- =============================================================================
-- Hirfa — Données de référence : catégories et paramètres du site.
-- Idempotent : peut être rejoué sans créer de doublons.
-- Les comptes et produits de démonstration sont créés par scripts/seed-demo.ts.
-- =============================================================================

insert into public.categories (name, slug, description, sort_order)
values
  ('Poterie & céramique', 'poterie-ceramique',
   'Jarres, plats et vaisselle en terre cuite, émaillés à la main à Nabeul, Guellala ou Sejnane.', 1),
  ('Tapis & tissage', 'tapis-tissage',
   'Mergoums, klims et tapis de Kairouan tissés à la main.', 2),
  ('Bijoux', 'bijoux',
   'Bijoux berbères, argent ciselé et pièces inspirées des traditions de Djerba.', 3),
  ('Cuir & maroquinerie', 'cuir-maroquinerie',
   'Sacs, babouches et accessoires en cuir travaillé dans les souks.', 4),
  ('Vannerie', 'vannerie',
   'Paniers, couffins et chapeaux en alfa et en palmier tressés.', 5),
  ('Bois d''olivier', 'bois-olivier',
   'Planches, bols et ustensiles sculptés dans le bois d''olivier.', 6),
  ('Broderie & textile', 'broderie-textile',
   'Fouta, linge brodé et vêtements traditionnels.', 7),
  ('Cuivre & dinanderie', 'cuivre-dinanderie',
   'Plateaux, lanternes et objets en cuivre martelé et ciselé.', 8),
  ('Verre soufflé', 'verre-souffle',
   'Verres, carafes et luminaires en verre soufflé à la bouche.', 9),
  ('Décoration', 'decoration',
   'Objets décoratifs, miroirs, zellige et luminaires.', 10),
  ('Savons & cosmétiques naturels', 'savons-cosmetiques-naturels',
   'Savons à l''huile d''olive, huiles et eaux florales artisanales.', 11)
on conflict (slug) do nothing;

insert into public.app_settings (id, shipping_fee, site_name, contact_email)
values (1, 7.000, 'Hirfa', 'contact@hirfa.tn')
on conflict (id) do update
  set contact_email = coalesce(public.app_settings.contact_email, excluded.contact_email);
