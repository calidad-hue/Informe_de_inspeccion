-- Buckets privados de Storage. El acceso siempre pasa por la service-role key
-- desde el servidor (lib/supabase/admin.ts); el cliente solo recibe URLs firmadas.

insert into storage.buckets (id, name, public)
values
  ('intake-photos', 'intake-photos', false),
  ('inspection-photos', 'inspection-photos', false),
  ('inspection-pdfs', 'inspection-pdfs', false)
on conflict (id) do nothing;
