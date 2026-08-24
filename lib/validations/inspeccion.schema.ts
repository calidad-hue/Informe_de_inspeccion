import { z } from "zod";

export const componenteOrigenValues = ["catalogo", "manual"] as const;

export const inspeccionComponenteSchema = z.object({
  seccion: z.string().min(1, "La sección es obligatoria"),
  origen: z.enum(componenteOrigenValues),
  repuesto_id: z.string().uuid().optional().nullable(),
  codigo_pn: z.string().optional(),
  descripcion: z.string().min(1, "La descripción es obligatoria"),
  diagnostico: z.string().optional(),
  solucion: z.string().optional(),
  cantidad: z.coerce.number().int().min(1).default(1),
});

export const accesoriosSchema = z.object({
  brazo_reaccion: z.boolean().default(false),
  cargador: z.boolean().default(false),
  num_baterias: z.coerce.number().int().min(0).default(0),
});

export const inspeccionDraftSchema = z.object({
  equipo_edad: z.string().optional(),
  accesorios: accesoriosSchema,
  prueba_sentido_giro: z.string().optional(),
  prueba_encendido: z.boolean().optional(),
  prueba_ruidos: z.string().optional(),
  causa_probable_falla: z.string().optional(),
});

export type InspeccionComponenteInput = z.infer<typeof inspeccionComponenteSchema>;
export type InspeccionDraftInput = z.infer<typeof inspeccionDraftSchema>;
