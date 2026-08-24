"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notaReciboSchema } from "@/lib/validations/recepcion.schema";

const INTAKE_PHOTOS_BUCKET = "intake-photos";

export interface NotaReciboFormState {
  error?: string;
}

export async function createNotaRecibo(
  _prevState: NotaReciboFormState,
  formData: FormData
): Promise<NotaReciboFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sesión no válida" };
  }

  const equiposCount = Number(formData.get("equipos_count") ?? 0);
  const equipos = Array.from({ length: equiposCount }, (_, i) => ({
    descripcion: formData.get(`equipos[${i}].descripcion`)?.toString() ?? "",
    equipo_tipo: formData.get(`equipos[${i}].equipo_tipo`)?.toString() ?? "",
    modelo: formData.get(`equipos[${i}].modelo`)?.toString() || undefined,
    serial: formData.get(`equipos[${i}].serial`)?.toString() || undefined,
  }));

  const parsed = notaReciboSchema.safeParse({
    fecha_recepcion: formData.get("fecha_recepcion")?.toString() ?? "",
    cliente_nombre: formData.get("cliente_nombre")?.toString() ?? "",
    cliente_correo: formData.get("cliente_correo")?.toString() ?? "",
    cliente_telefono: formData.get("cliente_telefono")?.toString() ?? "",
    documento_remisorio: formData.get("documento_remisorio")?.toString() ?? "",
    entrega_nombre: formData.get("entrega_nombre")?.toString() ?? "",
    entrega_cedula: formData.get("entrega_cedula")?.toString() ?? "",
    recibe_nombre: formData.get("recibe_nombre")?.toString() ?? "",
    recibe_cedula: formData.get("recibe_cedula")?.toString() ?? "",
    observaciones: formData.get("observaciones")?.toString() ?? "",
    equipos,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const { equipos: equiposData, ...notaFields } = parsed.data;

  const { data: nota, error: notaError } = await supabase
    .from("notas_recibo")
    .insert({ ...notaFields, cliente_correo: notaFields.cliente_correo || null, registrado_por: user.id })
    .select("id")
    .single();

  if (notaError || !nota) {
    return { error: notaError?.message ?? "No se pudo crear la nota de recibo" };
  }

  const { data: equiposInsertados, error: equiposError } = await supabase
    .from("equipos_recibidos")
    .insert(equiposData.map((e) => ({ ...e, nota_recibo_id: nota.id })))
    .select("id");

  if (equiposError) {
    return { error: equiposError.message };
  }

  const admin = createAdminClient();
  for (let i = 0; i < equiposInsertados.length; i++) {
    const files = formData.getAll(`equipos[${i}].fotos`) as File[];
    for (const file of files) {
      if (!(file instanceof File) || file.size === 0) continue;
      const path = `${equiposInsertados[i].id}/${crypto.randomUUID()}-${file.name}`;
      const { error: uploadError } = await admin.storage
        .from(INTAKE_PHOTOS_BUCKET)
        .upload(path, file, { contentType: file.type });
      if (!uploadError) {
        await supabase
          .from("fotos_recibo")
          .insert({ equipo_recibido_id: equiposInsertados[i].id, storage_path: path });
      }
    }
  }

  redirect(`/recepcion/${nota.id}`);
}

export async function iniciarInspeccion(equipoRecibidoId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Sesión no válida");
  }

  const { data, error } = await supabase
    .from("inspecciones")
    .insert({ equipo_recibido_id: equipoRecibidoId, created_by: user.id })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "No se pudo iniciar la inspección");
  }

  redirect(`/inspecciones/${data.id}`);
}
