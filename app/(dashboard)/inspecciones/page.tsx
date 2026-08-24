import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const statusLabels: Record<string, string> = {
  borrador: "Borrador",
  en_revision: "En revisión",
  rechazado: "Rechazado",
  aprobado: "Aprobado",
};

const statusColors: Record<string, string> = {
  borrador: "bg-neutral-light text-carbon",
  en_revision: "bg-blue-100 text-blue-800",
  rechazado: "bg-red-100 text-red-800",
  aprobado: "bg-green-100 text-green-800",
};

export default async function InspeccionesPage() {
  const supabase = await createClient();
  const { data: inspecciones } = await supabase
    .from("inspecciones")
    .select(
      `id, numero_ot, status, created_at,
       equipos_recibidos:equipo_recibido_id ( descripcion, notas_recibo:nota_recibo_id ( cliente_nombre ) )`
    )
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-carbon">Mis inspecciones</h1>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(inspecciones ?? []).map((i) => {
          const equipo = i.equipos_recibidos as unknown as {
            descripcion: string;
            notas_recibo: { cliente_nombre: string };
          } | null;
          return (
            <Link
              key={i.id}
              href={`/inspecciones/${i.id}`}
              className="bg-white rounded-lg shadow-sm p-4 hover:ring-2 hover:ring-industrial"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate">{i.numero_ot}</p>
                <span className={`text-xs px-2 py-1 rounded-full ${statusColors[i.status] ?? ""}`}>
                  {statusLabels[i.status] ?? i.status}
                </span>
              </div>
              <p className="font-semibold text-carbon">{equipo?.descripcion}</p>
              <p className="text-sm text-slate">{equipo?.notas_recibo?.cliente_nombre}</p>
            </Link>
          );
        })}
        {(inspecciones ?? []).length === 0 ? (
          <p className="text-slate col-span-full text-center py-8">
            Aún no tienes inspecciones. Inicia una desde una Nota de Recibo.
          </p>
        ) : null}
      </div>
    </div>
  );
}
