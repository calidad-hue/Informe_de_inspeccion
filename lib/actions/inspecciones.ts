"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { inspeccionDraftSchema } from "@/lib/validations/inspeccion.schema";

const INSPECTION_PHOTOS_BUCKET = "inspection-photos";

export async function updateInspeccionDraft(inspeccionId: string, formData: FormData) {
  const supabase = await createClient();

  const parsed = inspeccionDraftSchema.safeParse({
    equipo_edad: formData.get("equipo_edad")?.toString() ?? "",
    accesorios: {
      brazo_reaccion: formData.get("accesorios.brazo_reaccion") === "on",
      cargador: formData.get("accesorios.cargador") === "on",
      num_baterias: formData.get("accesorios.num_baterias")?.toString() ?? "0",
    },
    prueba_sentido_giro: formData.get("prueba_sentido_giro")?.toString() ?? "",
    prueba_encendido: formData.get("prueba_encendido") === "on",
    prueba_ruidos: formData.get("prueba_ruidos")?.toString() ?? "",
    causa_probable_falla: formData.get("causa_probable_falla")?.toString() ?? "",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  const { error } = await supabase
    .from("inspecciones")
    .update(parsed.data)
    .eq("id", inspeccionId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/inspecciones/${inspeccionId}`);
}

export async function addComponente(inspeccionId: string, formData: FormData) {
  const supabase = await createClient();

  const origen = formData.get("origen")?.toString();
  const repuestoId = formData.get("repuesto_id")?.toString() || null;

  const { data: componente, error } = await supabase
    .from("inspeccion_componentes")
    .insert({
      inspeccion_id: inspeccionId,
      seccion: formData.get("seccion")?.toString() ?? "General",
      origen: origen === "catalogo" ? "catalogo" : "manual",
      repuesto_id: origen === "catalogo" ? repuestoId : null,
      codigo_pn: formData.get("codigo_pn")?.toString() || null,
      descripcion: formData.get("descripcion")?.toString() ?? "",
      diagnostico: formData.get("diagnostico")?.toString() || null,
      solucion: formData.get("solucion")?.toString() || null,
      cantidad: Number(formData.get("cantidad") ?? 1),
    })
    .select("id")
    .single();

  if (error || !componente) {
    throw new Error(error?.message ?? "No se pudo agregar el componente");
  }

  const admin = createAdminClient();
  const files = formData.getAll("fotos") as File[];
  for (const file of files) {
    if (!(file instanceof File) || file.size === 0) continue;
    const path = `${componente.id}/${crypto.randomUUID()}-${file.name}`;
    const { error: uploadError } = await admin.storage
      .from(INSPECTION_PHOTOS_BUCKET)
      .upload(path, file, { contentType: file.type });
    if (!uploadError) {
      await supabase
        .from("fotos_componente")
        .insert({ inspeccion_componente_id: componente.id, storage_path: path });
    }
  }

  revalidatePath(`/inspecciones/${inspeccionId}`);
}

export async function deleteComponente(inspeccionId: string, componenteId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("inspeccion_componentes").delete().eq("id", componenteId);
  if (error) {
    throw new Error(error.message);
  }
  revalidatePath(`/inspecciones/${inspeccionId}`);
}

export async function submitInspeccion(inspeccionId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("inspecciones")
    .update({ status: "en_revision", submitted_at: new Date().toISOString() })
    .eq("id", inspeccionId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/inspecciones/${inspeccionId}`);
  revalidatePath("/inspecciones");
}
