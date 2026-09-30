-- Amplía los tipos de equipo (hidráulica, electrónica, otro) y agrega un campo
-- libre para especificar el tipo cuando se elige "otro".

alter table public.equipos_recibidos
  drop constraint equipos_recibidos_equipo_tipo_check;

alter table public.equipos_recibidos
  add constraint equipos_recibidos_equipo_tipo_check
  check (equipo_tipo in ('bateria', 'electrica', 'neumatica', 'hidraulica', 'electronica', 'otro'));

alter table public.equipos_recibidos
  add column equipo_tipo_otro text;
