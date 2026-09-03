-- Ajustes de rendimiento según los advisors de Supabase:
--   - app_settings.updated_by sin índice de FK
--   - dos políticas permissive para UPDATE en inspecciones (evaluadas ambas
--     en cada consulta) se combinan en una sola

create index app_settings_updated_by_idx on public.app_settings (updated_by);

drop policy inspecciones_update_tecnico on public.inspecciones;
drop policy inspecciones_update_admin on public.inspecciones;

create policy inspecciones_update on public.inspecciones
  for update to authenticated
  using (
    (select public.is_admin())
    or created_by = (select auth.uid())
  )
  with check (
    (select public.is_admin())
    or (created_by = (select auth.uid()) and status in ('borrador', 'en_revision', 'rechazado'))
  );
