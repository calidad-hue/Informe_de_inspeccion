import { z } from "zod";

export const equipoTipoValues = ["bateria", "electrica", "neumatica"] as const;

export const equipoRecibidoSchema = z.object({
  descripcion: z.string().min(1, "La descripción es obligatoria"),
  equipo_tipo: z.enum(equipoTipoValues),
  modelo: z.string().optional(),
  serial: z.string().optional(),
});

export const notaReciboSchema = z.object({
  fecha_recepcion: z.string().min(1, "La fecha es obligatoria"),
  cliente_nombre: z.string().min(1, "El nombre del cliente es obligatorio"),
  cliente_correo: z.string().email("Correo inválido").optional().or(z.literal("")),
  cliente_telefono: z.string().optional(),
  documento_remisorio: z.string().optional(),
  entrega_nombre: z.string().min(1, "El nombre de quien entrega es obligatorio"),
  entrega_cedula: z.string().min(1, "La cédula de quien entrega es obligatoria"),
  recibe_nombre: z.string().min(1, "El nombre de quien recibe es obligatorio"),
  recibe_cedula: z.string().min(1, "La cédula de quien recibe es obligatoria"),
  observaciones: z.string().optional(),
  equipos: z.array(equipoRecibidoSchema).min(1, "Debe registrar al menos un equipo"),
});

export type NotaReciboInput = z.infer<typeof notaReciboSchema>;
export type EquipoRecibidoInput = z.infer<typeof equipoRecibidoSchema>;
