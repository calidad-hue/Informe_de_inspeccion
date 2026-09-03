-- Endurecimiento de seguridad según los advisors de Supabase:
--   - search_path mutable en funciones trigger
--   - extensión pg_trgm instalada en el esquema public
--   - funciones SECURITY DEFINER ejecutables por roles que no las necesitan

-- search_path fijo en las funciones trigger (evita hijacking vía search_path)
alter function public.set_inspeccion_numero_ot() set search_path = '';
alter function public.set_updated_at() set search_path = '';
alter function public.set_nota_recibo_consecutivo() set search_path = '';

-- pg_trgm fuera del esquema public
create schema if not exists extensions;
alter extension pg_trgm set schema extensions;

-- handle_new_user solo debe dispararse desde el trigger on_auth_user_created,
-- nunca invocarse directamente vía RPC
revoke execute on function public.handle_new_user() from anon, authenticated;

-- is_admin() se sigue llamando desde las políticas RLS (rol authenticated),
-- pero anon nunca evalúa esas políticas, así que no lo necesita
revoke execute on function public.is_admin() from anon;
