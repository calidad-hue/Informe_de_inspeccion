"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const COMPANY_ASSETS_BUCKET = "company-assets";

interface CompanyHeader {
  nombre: string;
  nit?: string;
  direccion?: string;
  telefono?: string;
  logo_url?: string;
}

async function getCompanyHeader(supabase: Awaited<ReturnType<typeof createClient>>): Promise<CompanyHeader> {
  const { data } = await supabase
    .from("app_settings")
    .select("contenido")
    .eq("clave", "company_header")
    .single();
  return (data?.contenido ?? { nombre: "MOCER SAS" }) as CompanyHeader;
}

export async function updateCompanyHeader(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const current = await getCompanyHeader(supabase);

  const contenido: CompanyHeader = {
    ...current,
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

export async function uploadCompanyLogo(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const file = formData.get("logo") as File | null;
  if (!file || file.size === 0) {
    throw new Error("Debe seleccionar un archivo de imagen");
  }

  const admin = createAdminClient();
  const path = `logo/${crypto.randomUUID()}-${file.name}`;

  const { error: uploadError } = await admin.storage
    .from(COMPANY_ASSETS_BUCKET)
    .upload(path, file, { contentType: file.type });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const current = await getCompanyHeader(supabase);
  const previousPath = current.logo_url;

  const contenido: CompanyHeader = { ...current, logo_url: path };

  const { error } = await supabase
    .from("app_settings")
    .update({ contenido, updated_by: user?.id, updated_at: new Date().toISOString() })
    .eq("clave", "company_header");

  if (error) {
    throw new Error(error.message);
  }

  if (previousPath) {
    await admin.storage.from(COMPANY_ASSETS_BUCKET).remove([previousPath]);
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
