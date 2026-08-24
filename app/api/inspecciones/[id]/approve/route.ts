import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateAndStoreInspectionPdf } from "@/lib/pdf/generate";
import type { InspectionReportData } from "@/lib/pdf/InspectionReportDocument";

export const runtime = "nodejs";

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
       causa_probable_falla, created_by,
       equipos_recibidos:equipo_recibido_id (
         descripcion, equipo_tipo, modelo, serial,
         notas_recibo:nota_recibo_id ( consecutivo, fecha_recepcion, documento_remisorio, cliente_nombre )
       )`
    )
    .eq("id", id)
    .single();

  if (inspeccionError || !inspeccion) {
    return NextResponse.json({ error: inspeccionError?.message ?? "Inspección no encontrada" }, { status: 404 });
  }

  const { data: componentes } = await supabase
    .from("inspeccion_componentes")
    .select("seccion, descripcion, diagnostico, solucion, codigo_pn, cantidad, orden")
    .eq("inspeccion_id", id)
    .order("orden", { ascending: true });

  const { data: creador } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", inspeccion.created_by)
    .single();

  const { data: settingsRows } = await supabase
    .from("app_settings")
    .select("clave, contenido")
    .in("clave", ["company_header", "garantia_recomendaciones"]);

  const companyHeader = (settingsRows?.find((s) => s.clave === "company_header")?.contenido ?? {
    nombre: "MOCER SAS",
  }) as { nombre: string };

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

  const { error: updateError } = await supabase
    .from("inspecciones")
    .update({
      status: "aprobado",
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      garantia_recomendaciones_texto: garantiaTexto,
    })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  const reportData: InspectionReportData = {
    companyHeader,
    fechaInforme: new Date().toLocaleDateString("es-CO"),
    notaRecibo: {
      consecutivo: notaRecibo?.consecutivo ?? "-",
      fechaRecepcion: notaRecibo?.fecha_recepcion ?? "-",
      documentoRemisorio: notaRecibo?.documento_remisorio ?? undefined,
    },
    cliente: { nombre: notaRecibo?.cliente_nombre ?? "-" },
    equipo: {
      descripcion: equipoRecibido?.descripcion ?? "-",
      tipo: equipoRecibido?.equipo_tipo ?? "-",
      modelo: equipoRecibido?.modelo ?? undefined,
      serial: equipoRecibido?.serial ?? undefined,
      edad: inspeccion.equipo_edad ?? undefined,
    },
    numeroOt: inspeccion.numero_ot,
    hallazgos: (componentes ?? []).map((c) => ({
      seccion: c.seccion,
      descripcion: c.descripcion ?? "",
      diagnostico: c.diagnostico ?? undefined,
      solucion: c.solucion ?? undefined,
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
      codigoPn: c.codigo_pn ?? "-",
      cantidad: c.cantidad ?? 1,
    })),
    consideracionesGenerales: garantia.consideraciones_generales,
    recomendaciones: garantia.recomendaciones ?? [],
    tecnicoResponsable: creador?.full_name ?? "-",
  };

  try {
    const { storagePath } = await generateAndStoreInspectionPdf({
      inspeccionId: id,
      numeroOt: inspeccion.numero_ot,
      data: reportData,
    });

    await supabase
      .from("inspecciones")
      .update({ pdf_storage_path: storagePath, pdf_generated_at: new Date().toISOString() })
      .eq("id", id);

    return NextResponse.json({ ok: true, storagePath });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
