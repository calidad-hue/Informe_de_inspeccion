-- Datos semilla para desarrollo/demo local. No ejecutar en producción.

insert into public.app_settings (clave, contenido) values
  (
    'company_header',
    '{
      "nombre": "MOCER SAS",
      "nit": "",
      "direccion": "",
      "telefono": "",
      "logo_url": ""
    }'::jsonb
  ),
  (
    'garantia_recomendaciones',
    '{
      "consideraciones_generales": "Las partes no intervenidas o los repuestos no incluidos en la presente reparación no estarán cubiertos por garantía. La garantía de los componentes reemplazados aplica exclusivamente por defectos de fabricación y no cubre daños derivados de operación inadecuada, sobrecarga, falta de mantenimiento, contaminación o condiciones externas ajenas al proceso de reparación.",
      "recomendaciones": [
        "No intentar reparar la herramienta si no posee los manuales y entrenamiento proporcionado por la fábrica.",
        "Ante cualquier señal de ruido inusual, vibración o calentamiento, detenga el equipo de inmediato y remítalo a MOCER para su revisión.",
        "Se recomienda realizar mantenimiento preventivo al menos una vez cada 6 meses para aumentar la vida útil de la herramienta."
      ]
    }'::jsonb
  )
on conflict (clave) do nothing;

insert into public.repuestos (codigo_pn, categoria, descripcion, diagnostico_comun, solucion_estandar) values
  ('16577', 'mecanico', 'Rodamiento de bola tapa adaptadora', 'Marcas por apoyo inadecuado / desgaste severo', 'Proceder al reemplazo del rodamiento y mantenimiento preventivo'),
  ('10079', 'mecanico', 'Piñón planetario primera etapa', 'Daño por picado en dientes', 'Reemplazo del piñón y mantenimiento preventivo del conjunto')
on conflict (codigo_pn) do nothing;
