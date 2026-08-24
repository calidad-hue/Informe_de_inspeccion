import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSignedPdfUrl } from "@/lib/pdf/generate";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();

  if (profile?.role !== "administrador") {
    return NextResponse.json({ error: "Solo un administrador puede descargar el informe" }, { status: 403 });
  }

  const { data: inspeccion, error } = await supabase
    .from("inspecciones")
    .select("pdf_storage_path")
    .eq("id", id)
    .single();

  if (error || !inspeccion?.pdf_storage_path) {
    return NextResponse.json({ error: "El PDF aún no ha sido generado" }, { status: 404 });
  }

  const signedUrl = await createSignedPdfUrl(inspeccion.pdf_storage_path);

  return NextResponse.redirect(signedUrl);
}
