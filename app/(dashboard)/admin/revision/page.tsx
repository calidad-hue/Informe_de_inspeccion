import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const statusLabels: Record<string, string> = {
  borrador: "Borrador",
  en_revision: "En revisión",
  rechazado: "Rechazado",
  aprobado: "Aprobado",
};

const tabs = [
  { status: "en_revision", label: "En revisión" },
  { status: "rechazado", label: "Rechazados" },
  { status: "aprobado", label: "Aprobados" },
];

export default async function AdminRevisionPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const activeStatus = status && tabs.some((t) => t.status === status) ? status : "en_revision";

  const supabase = await createClient();
  const { data: inspecciones } = await supabase
    .from("inspecciones")
    .select(
      `id, numero_ot, status, created_at,
       equipos_recibidos:equipo_recibido_id ( descripcion, notas_recibo:nota_recibo_id ( cliente_nombre ) )`
    )
    .eq("status", activeStatus)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-carbon">Revisión de inspecciones</h1>

      <div className="flex gap-2">
        {tabs.map((t) => (
          <Link
            key={t.status}
            href={`/admin/revision?status=${t.status}`}
            className={`min-h-11 flex items-center rounded-md px-4 text-sm font-medium ${
              activeStatus === t.status ? "bg-carbon text-white" : "bg-white text-slate hover:bg-neutral-light"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(inspecciones ?? []).map((i) => {
          const equipo = i.equipos_recibidos as unknown as {
            descripcion: string;
            notas_recibo: { cliente_nombre: string };
          } | null;
          return (
            <Link
              key={i.id}
              href={`/admin/revision/${i.id}`}
              className="bg-white rounded-lg shadow-sm p-4 hover:ring-2 hover:ring-industrial"
            >
              <p className="text-xs text-slate">{i.numero_ot}</p>
              <p className="font-semibold text-carbon">{equipo?.descripcion}</p>
              <p className="text-sm text-slate">{equipo?.notas_recibo?.cliente_nombre}</p>
            </Link>
          );
        })}
        {(inspecciones ?? []).length === 0 ? (
          <p className="text-slate col-span-full text-center py-8">
            No hay inspecciones en estado &quot;{statusLabels[activeStatus]}&quot;.
          </p>
        ) : null}
      </div>
    </div>
  );
}
