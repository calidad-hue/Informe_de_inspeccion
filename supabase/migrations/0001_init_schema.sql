-- MOCER SAS — Sistema de Gestión de Informes de Inspección
-- 0001: esquema inicial (tablas, secuencias, triggers)

create extension if not exists "pgcrypto";

-- ==========================================================================
-- profiles
-- ==========================================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role text not null default 'tecnico' check (role in ('tecnico', 'administrador')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'administrador'
  );
$$;

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email), 'tecnico');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ==========================================================================
-- notas_recibo — recepción del equipo en MOCER
-- ==========================================================================
create sequence public.notas_recibo_consecutivo_seq;

create table public.notas_recibo (
  id uuid primary key default gen_random_uuid(),
  consecutivo text not null unique,
  fecha_recepcion date not null default current_date,
  cliente_nombre text not null,
  cliente_correo text,
  cliente_telefono text,
  documento_remisorio text,
  entrega_nombre text,
  entrega_cedula text,
  recibe_nombre text,
  recibe_cedula text,
  observaciones text,
  registrado_por uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create function public.set_nota_recibo_consecutivo()
returns trigger
language plpgsql
as $$
begin
  if new.consecutivo is null then
    new.consecutivo := 'RED' || lpad(nextval('public.notas_recibo_consecutivo_seq')::text, 7, '0');
  end if;
  return new;
end;
$$;

create trigger set_nota_recibo_consecutivo
  before insert on public.notas_recibo
  for each row execute function public.set_nota_recibo_consecutivo();

-- ==========================================================================
-- equipos_recibidos — uno o más equipos por nota de recibo
-- ==========================================================================
create table public.equipos_recibidos (
  id uuid primary key default gen_random_uuid(),
  nota_recibo_id uuid not null references public.notas_recibo (id) on delete cascade,
  descripcion text not null,
  equipo_tipo text not null check (equipo_tipo in ('bateria', 'electrica', 'neumatica')),
  modelo text,
  serial text,
  created_at timestamptz not null default now()
);

create index equipos_recibidos_nota_recibo_id_idx on public.equipos_recibidos (nota_recibo_id);

-- ==========================================================================
-- fotos_recibo — evidencia fotográfica del equipo al momento de recibirlo
-- ==========================================================================
create table public.fotos_recibo (
  id uuid primary key default gen_random_uuid(),
  equipo_recibido_id uuid not null references public.equipos_recibidos (id) on delete cascade,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create index fotos_recibo_equipo_recibido_id_idx on public.fotos_recibo (equipo_recibido_id);

-- ==========================================================================
-- repuestos — catálogo maestro (PRD Sección 3.A)
-- ==========================================================================
create table public.repuestos (
  id uuid primary key default gen_random_uuid(),
  codigo_pn text not null unique,
  categoria text not null check (categoria in ('mecanico', 'electrico', 'estructural')),
  descripcion text not null,
  diagnostico_comun text,
  solucion_estandar text,
  activo boolean not null default true,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create extension if not exists "pg_trgm";

create index repuestos_descripcion_trgm_idx on public.repuestos using gin (descripcion gin_trgm_ops);
create index repuestos_codigo_pn_trgm_idx on public.repuestos using gin (codigo_pn gin_trgm_ops);
create index repuestos_created_by_idx on public.repuestos (created_by);

-- ==========================================================================
-- inspecciones — orden de trabajo (OT) técnica
-- ==========================================================================
create sequence public.inspecciones_numero_ot_seq;

create table public.inspecciones (
  id uuid primary key default gen_random_uuid(),
  numero_ot text not null unique,
  equipo_recibido_id uuid not null references public.equipos_recibidos (id),
  status text not null default 'borrador' check (status in ('borrador', 'en_revision', 'rechazado', 'aprobado')),
  equipo_edad text,
  accesorios jsonb not null default '{}'::jsonb,
  prueba_sentido_giro text,
  prueba_encendido boolean,
  prueba_ruidos text,
  causa_probable_falla text,
  garantia_recomendaciones_texto text,
  created_by uuid not null references public.profiles (id),
  approved_by uuid references public.profiles (id),
  submitted_at timestamptz,
  approved_at timestamptz,
  rejected_reason text,
  pdf_storage_path text,
  pdf_generated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index inspecciones_equipo_recibido_id_idx on public.inspecciones (equipo_recibido_id);
create index inspecciones_created_by_idx on public.inspecciones (created_by);
create index inspecciones_approved_by_idx on public.inspecciones (approved_by);
create index inspecciones_status_idx on public.inspecciones (status);

create function public.set_inspeccion_numero_ot()
returns trigger
language plpgsql
as $$
begin
  if new.numero_ot is null then
    new.numero_ot := 'OT-' || lpad(nextval('public.inspecciones_numero_ot_seq')::text, 6, '0');
  end if;
  return new;
end;
$$;

create trigger set_inspeccion_numero_ot
  before insert on public.inspecciones
  for each row execute function public.set_inspeccion_numero_ot();

-- ==========================================================================
-- inspeccion_componentes — hallazgos de diagnóstico agrupados por sección
-- ==========================================================================
create table public.inspeccion_componentes (
  id uuid primary key default gen_random_uuid(),
  inspeccion_id uuid not null references public.inspecciones (id) on delete cascade,
  seccion text not null,
  orden integer not null default 0,
  origen text not null check (origen in ('catalogo', 'manual')),
  repuesto_id uuid references public.repuestos (id),
  codigo_pn text,
  descripcion text,
  diagnostico text,
  solucion text,
  cantidad integer not null default 1,
  created_at timestamptz not null default now()
);

create index inspeccion_componentes_inspeccion_id_idx on public.inspeccion_componentes (inspeccion_id);
create index inspeccion_componentes_repuesto_id_idx on public.inspeccion_componentes (repuesto_id);

-- ==========================================================================
-- fotos_componente — evidencia fotográfica del daño por componente
-- ==========================================================================
create table public.fotos_componente (
  id uuid primary key default gen_random_uuid(),
  inspeccion_componente_id uuid not null references public.inspeccion_componentes (id) on delete cascade,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create index fotos_componente_inspeccion_componente_id_idx on public.fotos_componente (inspeccion_componente_id);

-- ==========================================================================
-- app_settings — texto de garantía/recomendaciones y encabezado de empresa
-- ==========================================================================
create table public.app_settings (
  id uuid primary key default gen_random_uuid(),
  clave text not null unique,
  contenido jsonb not null,
  updated_by uuid references public.profiles (id),
  updated_at timestamptz not null default now()
);

-- updated_at bookkeeping ----------------------------------------------------
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.notas_recibo
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.repuestos
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.inspecciones
  for each row execute function public.set_updated_at();
