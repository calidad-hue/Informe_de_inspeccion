-- MOCER SAS — Sistema de Gestión de Informes de Inspección
-- 0002: Row Level Security — capa principal de control de acceso por rol

alter table public.profiles enable row level security;
alter table public.notas_recibo enable row level security;
alter table public.equipos_recibidos enable row level security;
alter table public.fotos_recibo enable row level security;
alter table public.repuestos enable row level security;
alter table public.inspecciones enable row level security;
alter table public.inspeccion_componentes enable row level security;
alter table public.fotos_componente enable row level security;
alter table public.app_settings enable row level security;

-- ==========================================================================
-- profiles — cada quien lee su propio perfil; admin lee/edita todos
-- ==========================================================================
create policy profiles_select_own on public.profiles
  for select using (id = auth.uid() or public.is_admin());

create policy profiles_update_admin on public.profiles
  for update using (public.is_admin());

-- ==========================================================================
-- notas_recibo / equipos_recibidos / fotos_recibo
-- técnico: solo lo que registró. admin: todo.
-- ==========================================================================
create policy notas_recibo_select on public.notas_recibo
  for select using (registrado_por = auth.uid() or public.is_admin());

create policy notas_recibo_insert on public.notas_recibo
  for insert with check (registrado_por = auth.uid() or public.is_admin());

create policy notas_recibo_update on public.notas_recibo
  for update using (registrado_por = auth.uid() or public.is_admin());

create policy equipos_recibidos_select on public.equipos_recibidos
  for select using (
    exists (
      select 1 from public.notas_recibo nr
      where nr.id = equipos_recibidos.nota_recibo_id
        and (nr.registrado_por = auth.uid() or public.is_admin())
    )
  );

create policy equipos_recibidos_insert on public.equipos_recibidos
  for insert with check (
    exists (
      select 1 from public.notas_recibo nr
      where nr.id = equipos_recibidos.nota_recibo_id
        and (nr.registrado_por = auth.uid() or public.is_admin())
    )
  );

create policy equipos_recibidos_update on public.equipos_recibidos
  for update using (
    exists (
      select 1 from public.notas_recibo nr
      where nr.id = equipos_recibidos.nota_recibo_id
        and (nr.registrado_por = auth.uid() or public.is_admin())
    )
  );

create policy fotos_recibo_select on public.fotos_recibo
  for select using (
    exists (
      select 1 from public.equipos_recibidos er
      join public.notas_recibo nr on nr.id = er.nota_recibo_id
      where er.id = fotos_recibo.equipo_recibido_id
        and (nr.registrado_por = auth.uid() or public.is_admin())
    )
  );

create policy fotos_recibo_insert on public.fotos_recibo
  for insert with check (
    exists (
      select 1 from public.equipos_recibidos er
      join public.notas_recibo nr on nr.id = er.nota_recibo_id
      where er.id = fotos_recibo.equipo_recibido_id
        and (nr.registrado_por = auth.uid() or public.is_admin())
    )
  );

create policy fotos_recibo_delete on public.fotos_recibo
  for delete using (
    exists (
      select 1 from public.equipos_recibidos er
      join public.notas_recibo nr on nr.id = er.nota_recibo_id
      where er.id = fotos_recibo.equipo_recibido_id
        and (nr.registrado_por = auth.uid() or public.is_admin())
    )
  );

-- ==========================================================================
-- repuestos — catálogo maestro: lectura para cualquier autenticado, escritura solo admin
-- ==========================================================================
create policy repuestos_select_authenticated on public.repuestos
  for select using (auth.uid() is not null);

create policy repuestos_insert_admin on public.repuestos
  for insert with check (public.is_admin());

create policy repuestos_update_admin on public.repuestos
  for update using (public.is_admin());

create policy repuestos_delete_admin on public.repuestos
  for delete using (public.is_admin());

-- ==========================================================================
-- inspecciones — técnico ve/edita solo lo suyo y no puede auto-aprobarse
-- ==========================================================================
create policy inspecciones_select on public.inspecciones
  for select using (created_by = auth.uid() or public.is_admin());

create policy inspecciones_insert on public.inspecciones
  for insert with check (created_by = auth.uid() or public.is_admin());

create policy inspecciones_update_tecnico on public.inspecciones
  for update using (created_by = auth.uid() and not public.is_admin())
  with check (
    created_by = auth.uid()
    and status in ('borrador', 'en_revision', 'rechazado')
  );

create policy inspecciones_update_admin on public.inspecciones
  for update using (public.is_admin())
  with check (public.is_admin());

-- ==========================================================================
-- inspeccion_componentes / fotos_componente — heredan la política de la inspección padre
-- ==========================================================================
create policy inspeccion_componentes_select on public.inspeccion_componentes
  for select using (
    exists (
      select 1 from public.inspecciones i
      where i.id = inspeccion_componentes.inspeccion_id
        and (i.created_by = auth.uid() or public.is_admin())
    )
  );

create policy inspeccion_componentes_insert on public.inspeccion_componentes
  for insert with check (
    exists (
      select 1 from public.inspecciones i
      where i.id = inspeccion_componentes.inspeccion_id
        and (i.created_by = auth.uid() or public.is_admin())
        and i.status in ('borrador', 'en_revision', 'rechazado')
    )
  );

create policy inspeccion_componentes_update on public.inspeccion_componentes
  for update using (
    exists (
      select 1 from public.inspecciones i
      where i.id = inspeccion_componentes.inspeccion_id
        and (i.created_by = auth.uid() or public.is_admin())
        and i.status in ('borrador', 'en_revision', 'rechazado')
    )
  );

create policy inspeccion_componentes_delete on public.inspeccion_componentes
  for delete using (
    exists (
      select 1 from public.inspecciones i
      where i.id = inspeccion_componentes.inspeccion_id
        and (i.created_by = auth.uid() or public.is_admin())
        and i.status in ('borrador', 'en_revision', 'rechazado')
    )
  );

create policy fotos_componente_select on public.fotos_componente
  for select using (
    exists (
      select 1 from public.inspeccion_componentes ic
      join public.inspecciones i on i.id = ic.inspeccion_id
      where ic.id = fotos_componente.inspeccion_componente_id
        and (i.created_by = auth.uid() or public.is_admin())
    )
  );

create policy fotos_componente_insert on public.fotos_componente
  for insert with check (
    exists (
      select 1 from public.inspeccion_componentes ic
      join public.inspecciones i on i.id = ic.inspeccion_id
      where ic.id = fotos_componente.inspeccion_componente_id
        and (i.created_by = auth.uid() or public.is_admin())
        and i.status in ('borrador', 'en_revision', 'rechazado')
    )
  );

create policy fotos_componente_delete on public.fotos_componente
  for delete using (
    exists (
      select 1 from public.inspeccion_componentes ic
      join public.inspecciones i on i.id = ic.inspeccion_id
      where ic.id = fotos_componente.inspeccion_componente_id
        and (i.created_by = auth.uid() or public.is_admin())
        and i.status in ('borrador', 'en_revision', 'rechazado')
    )
  );

-- ==========================================================================
-- app_settings — lectura para cualquier autenticado, escritura solo admin
-- ==========================================================================
create policy app_settings_select_authenticated on public.app_settings
  for select using (auth.uid() is not null);

create policy app_settings_insert_admin on public.app_settings
  for insert with check (public.is_admin());

create policy app_settings_update_admin on public.app_settings
  for update using (public.is_admin());

-- ==========================================================================
-- Storage buckets privados (crear vía consola/CLI de Supabase antes de aplicar):
--   intake-photos, inspection-photos, inspection-pdfs
-- Las tres se leen/escriben solo desde el servidor con la service-role key;
-- el cliente nunca accede al bucket directamente, solo recibe URLs firmadas.
-- ==========================================================================
