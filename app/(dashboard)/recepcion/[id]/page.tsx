import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { iniciarInspeccion } from "@/lib/actions/recepcion";

const equipoTipoLabels: Record<string, string> = {
  bateria: "A batería",
  electrica: "Eléctrica",
  neumatica: "Neumática",
};

export default async function NotaReciboDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: nota } = await supabase.from("notas_recibo").select("*").eq("id", id).single();

  if (!nota) {
    notFound();
  }

  const { data: equipos } = await supabase
    .from("equipos_recibidos")
    .select("id, descripcion, equipo_tipo, modelo, serial, fotos_recibo(id, storage_path), inspecciones(id, numero_ot, status)")
    .eq("nota_recibo_id", id);

  const admin = createAdminClient();
  const equiposConFotos = await Promise.all(
    (equipos ?? []).map(async (eq) => {
      const fotos = await Promise.all(
        (eq.fotos_recibo ?? []).map(async (f) => {
          const { data } = await admin.storage.from("intake-photos").createSignedUrl(f.storage_path, 300);
          return data?.signedUrl;
        })
      );
      return { ...eq, fotoUrls: fotos.filter(Boolean) as string[] };
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate">{nota.consecutivo}</p>
        <h1 className="text-xl font-bold text-carbon">{nota.cliente_nombre}</h1>
        <p className="text-sm text-slate">Recibido el {nota.fecha_recepcion}</p>
      </div>

      <section className="bg-white rounded-lg shadow-sm p-6 grid sm:grid-cols-2 gap-4 text-sm">
        <Info label="Correo" value={nota.cliente_correo} />
        <Info label="Teléfono" value={nota.cliente_telefono} />
        <Info label="Documento remisorio" value={nota.documento_remisorio} />
        <Info label="Observaciones" value={nota.observaciones} />
        <Info label="Entrega" value={`${nota.entrega_nombre ?? "-"} (CC ${nota.entrega_cedula ?? "-"})`} />
        <Info label="Recibe en MOCER" value={`${nota.recibe_nombre ?? "-"} (CC ${nota.recibe_cedula ?? "-"})`} />
      </section>

      <section className="space-y-4">
        <h2 className="font-bold text-carbon">Equipos recibidos</h2>
        {equiposConFotos.map((eq) => {
          const inspeccion = eq.inspecciones?.[0];
          return (
            <div key={eq.id} className="bg-white rounded-lg shadow-sm p-6 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="font-semibold text-carbon">{eq.descripcion}</p>
                  <p className="text-sm text-slate">
                    {equipoTipoLabels[eq.equipo_tipo] ?? eq.equipo_tipo} · Modelo {eq.modelo ?? "-"} · Serial{" "}
                    {eq.serial ?? "-"}
                  </p>
                </div>
                {inspeccion ? (
                  <Link
                    href={`/inspecciones/${inspeccion.id}`}
                    className="min-h-11 flex items-center rounded-md bg-carbon text-white px-4 text-sm hover:bg-carbon/90"
                  >
                    Ver inspección {inspeccion.numero_ot}
                  </Link>
                ) : (
                  <form action={iniciarInspeccion.bind(null, eq.id)}>
                    <button
                      type="submit"
                      className="min-h-11 flex items-center rounded-md bg-industrial text-carbon font-semibold px-4 text-sm hover:brightness-95"
                    >
                      Iniciar inspección
                    </button>
                  </form>
                )}
              </div>
              {eq.fotoUrls.length > 0 ? (
                <div className="flex gap-2 flex-wrap">
                  {eq.fotoUrls.map((url) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={url} src={url} alt="" className="h-20 w-20 object-cover rounded-md" />
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-slate">{label}</p>
      <p className="text-carbon">{value || "-"}</p>
    </div>
  );
}
