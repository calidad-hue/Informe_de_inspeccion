"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateCompanyHeader(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const contenido = {
    nombre: formData.get("nombre")?.toString() ?? "MOCER SAS",
    nit: formData.get("nit")?.toString() ?? "",
    direccion: formData.get("direccion")?.toString() ?? "",
    telefono: formData.get("telefono")?.toString() ?? "",
  };

  const { error } = await supabase
    .from("app_settings")
    .update({ contenido, updated_by: user?.id, updated_at: new Date().toISOString() })
    .eq("clave", "company_header");

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/plantillas");
}

export async function updateGarantiaRecomendaciones(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const recomendacionesRaw = formData.get("recomendaciones")?.toString() ?? "";
  const recomendaciones = recomendacionesRaw
    .split("\n")
    .map((r) => r.trim())
    .filter(Boolean);

  const contenido = {
    consideraciones_generales: formData.get("consideraciones_generales")?.toString() ?? "",
    recomendaciones,
  };

  const { error } = await supabase
    .from("app_settings")
    .update({ contenido, updated_by: user?.id, updated_at: new Date().toISOString() })
    .eq("clave", "garantia_recomendaciones");

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/plantillas");
}
