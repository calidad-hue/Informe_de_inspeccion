import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { InspeccionDraftForm } from "@/components/inspection/InspeccionDraftForm";
import { ComponentPicker } from "@/components/inspection/ComponentPicker";
import { deleteComponente } from "@/lib/actions/inspecciones";

const statusLabels: Record<string, string> = {
  borrador: "Borrador",
  en_revision: "En revisión",
  rechazado: "Rechazado",
  aprobado: "Aprobado",
};

export default async function InspeccionDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: inspeccion } = await supabase
    .from("inspecciones")
    .select(
      `*, equipos_recibidos:equipo_recibido_id (
        descripcion, equipo_tipo, modelo, serial,
        notas_recibo:nota_recibo_id ( consecutivo, cliente_nombre )
      )`
    )
    .eq("id", id)
    .single();

  if (!inspeccion) {
    notFound();
  }

  const { data: componentes } = await supabase
    .from("inspeccion_componentes")
    .select("id, seccion, descripcion, codigo_pn, diagnostico, solucion, cantidad, origen, fotos_componente(id, storage_path)")
    .eq("inspeccion_id", id)
    .order("orden", { ascending: true });

  const admin = createAdminClient();
  const componentesConFotos = await Promise.all(
    (componentes ?? []).map(async (c) => {
      const fotos = await Promise.all(
        (c.fotos_componente ?? []).map(async (f) => {
          const { data } = await admin.storage.from("inspection-photos").createSignedUrl(f.storage_path, 300);
          return data?.signedUrl;
        })
      );
      return { ...c, fotoUrls: fotos.filter(Boolean) as string[] };
    })
  );

  const bySeccion = new Map<string, typeof componentesConFotos>();
  for (const c of componentesConFotos) {
    const list = bySeccion.get(c.seccion) ?? [];
    list.push(c);
    bySeccion.set(c.seccion, list);
  }

  const equipo = inspeccion.equipos_recibidos as unknown as {
    descripcion: string;
    equipo_tipo: string;
    modelo: string | null;
    serial: string | null;
    notas_recibo: { consecutivo: string; cliente_nombre: string };
  };

  const editable = inspeccion.status === "borrador" || inspeccion.status === "rechazado";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-sm text-slate">
            {inspeccion.numero_ot} · Nota de recibo {equipo.notas_recibo?.consecutivo}
          </p>
          <h1 className="text-xl font-bold text-carbon">
            {equipo.descripcion} — {equipo.notas_recibo?.cliente_nombre}
          </h1>
          <p className="text-sm text-slate">
            Modelo {equipo.modelo ?? "-"} · Serial {equipo.serial ?? "-"}
          </p>
        </div>
        <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-neutral-light text-carbon">
          {statusLabels[inspeccion.status] ?? inspeccion.status}
        </span>
      </div>

      <InspeccionDraftForm
        id={id}
        editable={editable}
        values={{
          equipo_edad: inspeccion.equipo_edad,
          accesorios: inspeccion.accesorios,
          prueba_sentido_giro: inspeccion.prueba_sentido_giro,
          prueba_encendido: inspeccion.prueba_encendido,
          prueba_ruidos: inspeccion.prueba_ruidos,
          causa_probable_falla: inspeccion.causa_probable_falla,
          status: inspeccion.status,
          rejected_reason: inspeccion.rejected_reason,
        }}
      />

      <section className="space-y-4">
        <h2 className="font-bold text-carbon">Diagnóstico por sección</h2>

        {Array.from(bySeccion.entries()).map(([seccion, items]) => (
          <div key={seccion} className="bg-white rounded-lg shadow-sm p-4 space-y-3">
            <h3 className="font-semibold text-slate">{seccion}</h3>
            {items.map((c) => (
              <div key={c.id} className="border border-neutral-light rounded-md p-3 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-carbon">
                      {c.codigo_pn ? <span className="font-mono text-xs text-slate mr-2">{c.codigo_pn}</span> : null}
                      {c.descripcion} {c.cantidad > 1 ? `(x${c.cantidad})` : ""}
                    </p>
                    {c.diagnostico ? <p className="text-sm text-slate">Diagnóstico: {c.diagnostico}</p> : null}
                    {c.solucion ? <p className="text-sm text-slate">Solución: {c.solucion}</p> : null}
                  </div>
                  {editable ? (
                    <form action={deleteComponente.bind(null, id, c.id)}>
                      <button type="submit" className="text-xs text-red-600 underline whitespace-nowrap">
                        Quitar
                      </button>
                    </form>
                  ) : null}
                </div>
                {c.fotoUrls.length > 0 ? (
                  <div className="flex gap-2 flex-wrap pt-1">
                    {c.fotoUrls.map((url) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={url} src={url} alt="" className="h-16 w-16 object-cover rounded-md" />
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ))}

        {editable ? <ComponentPicker inspeccionId={id} /> : null}
      </section>
    </div>
  );
}
