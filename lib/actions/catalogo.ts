"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface RepuestoFormState {
  error?: string;
}

const categoriaValues = ["mecanico", "electrico", "estructural"] as const;

function readRepuestoFields(formData: FormData) {
  const categoria = formData.get("categoria")?.toString() ?? "";
  if (!categoriaValues.includes(categoria as (typeof categoriaValues)[number])) {
    throw new Error("Categoría inválida");
  }

  return {
    codigo_pn: formData.get("codigo_pn")?.toString().trim() ?? "",
    categoria: categoria as (typeof categoriaValues)[number],
    descripcion: formData.get("descripcion")?.toString().trim() ?? "",
    diagnostico_comun: formData.get("diagnostico_comun")?.toString().trim() || null,
    solucion_estandar: formData.get("solucion_estandar")?.toString().trim() || null,
  };
}

export async function createRepuesto(
  _prevState: RepuestoFormState,
  formData: FormData
): Promise<RepuestoFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let fields;
  try {
    fields = readRepuestoFields(formData);
  } catch (e) {
    return { error: (e as Error).message };
  }

  if (!fields.codigo_pn || !fields.descripcion) {
    return { error: "P/N y descripción son obligatorios" };
  }

  const { error } = await supabase.from("repuestos").insert({
    ...fields,
    created_by: user?.id,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/catalogo");
  redirect("/admin/catalogo");
}

export async function updateRepuesto(
  id: string,
  _prevState: RepuestoFormState,
  formData: FormData
): Promise<RepuestoFormState> {
  const supabase = await createClient();

  let fields;
  try {
    fields = readRepuestoFields(formData);
  } catch (e) {
    return { error: (e as Error).message };
  }

  const { error } = await supabase.from("repuestos").update(fields).eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/catalogo");
  redirect("/admin/catalogo");
}

export async function toggleRepuestoActivo(id: string, activo: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("repuestos").update({ activo }).eq("id", id);
  if (error) {
    throw new Error(error.message);
  }
  revalidatePath("/admin/catalogo");
}

export async function searchRepuestos(query: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("repuestos")
    .select("id, codigo_pn, categoria, descripcion, diagnostico_comun, solucion_estandar")
    .eq("activo", true)
    .or(`codigo_pn.ilike.%${query}%,descripcion.ilike.%${query}%`)
    .limit(20);

  if (error) {
    throw new Error(error.message);
  }
  return data;
}
