-- Custom Access Token Hook: embebe profiles.role en el JWT (app_metadata.role)
-- para que middleware.ts pueda verificar el rol sin una consulta a la base de datos.
--
-- IMPORTANTE: después de aplicar esta migración, hay que habilitar el hook manualmente
-- en el dashboard de Supabase: Authentication > Hooks (Beta) > Customize Access Token (JWT) Claims
-- y seleccionar la función public.custom_access_token_hook. Esto no se puede hacer por SQL.

create function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  claims jsonb;
  user_role text;
begin
  select role into user_role from public.profiles where id = (event ->> 'user_id')::uuid;

  claims := event -> 'claims';
  claims := jsonb_set(claims, '{user_role}', to_jsonb(coalesce(user_role, 'tecnico')));

  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$$;

grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook from authenticated, anon, public;

grant select on public.profiles to supabase_auth_admin;
