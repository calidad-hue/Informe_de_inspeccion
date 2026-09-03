-- Corrección: revocar EXECUTE solo de anon/authenticated no basta, porque ambos
-- heredan privilegios del pseudo-rol PUBLIC. Hay que revocar de PUBLIC directamente
-- y luego re-otorgar explícitamente solo donde sí se necesita.

revoke execute on function public.handle_new_user() from public;
-- Los triggers se disparan sin pasar por el chequeo normal de EXECUTE,
-- así que revocar de PUBLIC no rompe el alta de usuarios en auth.users.

revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;
-- is_admin() se invoca desde políticas RLS evaluadas como "authenticated";
-- anon nunca evalúa esas políticas y no necesita poder llamarla.
