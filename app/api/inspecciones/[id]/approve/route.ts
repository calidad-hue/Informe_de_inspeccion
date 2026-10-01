import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateAndStoreInspectionPdf } from "@/lib/pdf/generate";
import type { InspectionReportData } from "@/lib/pdf/InspectionReportDocument";
import { formatEquipoTipo } from "@/lib/validations/recepcion.schema";

export const runtime = "nodejs";

async function signedUrls(
  admin: ReturnType<typeof createAdminClient>,
  bucket: string,
  paths: string[]
): Promise<string[]> {
  const urls = await Promise.all(
    paths.map(async (path) => {
      const { data } = await admin.storage.from(bucket).createSignedUrl(path, 3600);
      return data?.signedUrl;
    })
  );
  return urls.filter((u): u is string => !!u);
}

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "administrador") {
    return NextResponse.json({ error: "Solo un administrador puede aprobar" }, { status: 403 });
  }

  const { data: inspeccion, error: inspeccionError } = await supabase
    .from("inspecciones")
    .select(
      `id, numero_ot, equipo_edad, accesorios, prueba_sentido_giro, prueba_encendido, prueba_ruidos,
       causa_probable_falla, created_by, equipo_recibido_id,
       equipos_recibidos:equipo_recibido_id (
         descripcion, equipo_tipo, equipo_tipo_otro, modelo, serial,
         notas_recibo:nota_recibo_id ( consecutivo, fecha_recepcion, documento_remisorio, cliente_nombre, observaciones )
       )`
    )
    .eq("id", id)
    .single();

  if (inspeccionError || !inspeccion) {
    return NextResponse.json({ error: inspeccionError?.message ?? "Inspección no encontrada" }, { status: 404 });
  }

  const { data: componentes } = await supabase
    .from("inspeccion_componentes")
    .select("id, seccion, descripcion, diagnostico, solucion, codigo_pn, cantidad, orden")
    .eq("inspeccion_id", id)
    .order("orden", { ascending: true });

  const { data: fotosRecibo } = await supabase
    .from("fotos_recibo")
    .select("storage_path")
    .eq("equipo_recibido_id", inspeccion.equipo_recibido_id);

  const componenteIds = (componentes ?? []).map((c) => c.id);
  const { data: fotosComponente } = componenteIds.length
    ? await supabase
        .from("fotos_componente")
        .select("inspeccion_componente_id, storage_path")
        .in("inspeccion_componente_id", componenteIds)
    : { data: [] as { inspeccion_componente_id: string; storage_path: string }[] };

  const { data: creador } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", inspeccion.created_by)
    .single();

  const { data: settingsRows } = await supabase
    .from("app_settings")
    .select("clave, contenido")
    .in("clave", ["company_header", "garantia_recomendaciones"]);

  const companyHeaderRaw = (settingsRows?.find((s) => s.clave === "company_header")?.contenido ?? {
    nombre: "MOCER SAS",
  }) as { nombre: string; nit?: string; direccion?: string; telefono?: string; logo_url?: string };

  const garantia = (settingsRows?.find((s) => s.clave === "garantia_recomendaciones")?.contenido ?? {
    consideraciones_generales: "",
    recomendaciones: [],
  }) as { consideraciones_generales: string; recomendaciones: string[] };

  const equipoRecibido = Array.isArray(inspeccion.equipos_recibidos)
    ? inspeccion.equipos_recibidos[0]
    : inspeccion.equipos_recibidos;
  const notaRecibo = Array.isArray(equipoRecibido?.notas_recibo)
    ? equipoRecibido.notas_recibo[0]
    : equipoRecibido?.notas_recibo;

  const garantiaTexto = JSON.stringify(garantia);

  const admin = createAdminClient();

  const [logoUrls, recepcionFotoUrls] = await Promise.all([
    companyHeaderRaw.logo_url ? signedUrls(admin, "company-assets", [companyHeaderRaw.logo_url]) : Promise.resolve([]),
    signedUrls(admin, "intake-photos", (fotosRecibo ?? []).map((f) => f.storage_path)),
  ]);

  const fotosByComponente = new Map<string, string[]>();
  for (const f of fotosComponente ?? []) {
    const list = fotosByComponente.get(f.inspeccion_componente_id) ?? [];
    list.push(f.storage_path);
    fotosByComponente.set(f.inspeccion_componente_id, list);
  }
  const componenteFotoUrlsById = new Map<string, string[]>();
  for (const [componenteId, paths] of fotosByComponente) {
    componenteFotoUrlsById.set(componenteId, await signedUrls(admin, "inspection-photos", paths));
  }

  const reportData: InspectionReportData = {
    companyHeader: {
      nombre: companyHeaderRaw.nombre,
      nit: companyHeaderRaw.nit || undefined,
      direccion: companyHeaderRaw.direccion || undefined,
      telefono: companyHeaderRaw.telefono || undefined,
      logoUrl: logoUrls[0],
    },
    fechaInforme: new Date().toLocaleDateString("es-CO"),
    notaRecibo: {
      consecutivo: notaRecibo?.consecutivo ?? "-",
      fechaRecepcion: notaRecibo?.fecha_recepcion ?? "-",
      documentoRemisorio: notaRecibo?.documento_remisorio ?? undefined,
    },
    cliente: { nombre: notaRecibo?.cliente_nombre ?? "-" },
    equipo: {
      descripcion: equipoRecibido?.descripcion ?? "-",
      tipo: formatEquipoTipo(equipoRecibido?.equipo_tipo, equipoRecibido?.equipo_tipo_otro),
      modelo: equipoRecibido?.modelo ?? undefined,
      serial: equipoRecibido?.serial ?? undefined,
      edad: inspeccion.equipo_edad ?? undefined,
    },
    numeroOt: inspeccion.numero_ot,
    recepcion: {
      observaciones: notaRecibo?.observaciones ?? undefined,
      fotos: recepcionFotoUrls.map((url) => ({ url })),
    },
    hallazgos: (componentes ?? []).map((c) => ({
      seccion: c.seccion,
      descripcion: c.descripcion ?? "",
      codigoPn: c.codigo_pn ?? undefined,
      diagnostico: c.diagnostico ?? undefined,
      recomendacion: c.solucion ?? undefined,
      fotos: (componenteFotoUrlsById.get(c.id) ?? []).map((url) => ({ url })),
    })),
    pruebaFuncionamiento: {
      sentidoGiro: inspeccion.prueba_sentido_giro ?? undefined,
      encendido: inspeccion.prueba_encendido ?? undefined,
      ruidos: inspeccion.prueba_ruidos ?? undefined,
    },
    causaProbableFalla: inspeccion.causa_probable_falla ?? undefined,
    repuestos: (componentes ?? []).map((c, idx) => ({
      numero: idx + 1,
      descripcion: c.descripcion ?? "",
      codigoPn: c.codigo_pn ?? undefined,
      cantidad: c.cantidad ?? 1,
    })),
    consideracionesGenerales: garantia.consideraciones_generales || undefined,
    recomendaciones: garantia.recomendaciones ?? [],
    tecnicoResponsable: creador?.full_name ?? "-",
  };

  let storagePath: string;
  try {
    const result = await generateAndStoreInspectionPdf({
      inspeccionId: id,
      numeroOt: inspeccion.numero_ot,
      data: reportData,
    });
    storagePath = result.storagePath;
  } catch (e) {
    return NextResponse.json({ error: `No se pudo generar el PDF: ${(e as Error).message}` }, { status: 500 });
  }

  const { error: updateError } = await supabase
    .from("inspecciones")
    .update({
      status: "aprobado",
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      garantia_recomendaciones_texto: garantiaTexto,
      pdf_storage_path: storagePath,
      pdf_generated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, storagePath });
}
