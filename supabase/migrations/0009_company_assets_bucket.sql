-- Bucket privado para el logo de la empresa usado en el encabezado del PDF.
-- Mismo patrón que los demás buckets: solo accesible vía service-role + URL firmada.

insert into storage.buckets (id, name, public)
values ('company-assets', 'company-assets', false)
on conflict (id) do nothing;
