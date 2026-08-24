import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function RecepcionPage() {
  const supabase = await createClient();
  const { data: notas } = await supabase
    .from("notas_recibo")
    .select("id, consecutivo, fecha_recepcion, cliente_nombre, equipos_recibidos(count)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-carbon">Notas de Recibo</h1>
        <Link
          href="/recepcion/nueva"
          className="min-h-11 flex items-center rounded-md bg-industrial text-carbon font-semibold px-4 hover:brightness-95"
        >
          + Nueva recepción
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(notas ?? []).map((n) => (
          <Link
            key={n.id}
            href={`/recepcion/${n.id}`}
            className="bg-white rounded-lg shadow-sm p-4 hover:ring-2 hover:ring-industrial"
          >
            <p className="text-xs text-slate">{n.consecutivo}</p>
            <p className="font-semibold text-carbon">{n.cliente_nombre}</p>
            <p className="text-sm text-slate">{n.fecha_recepcion}</p>
            <p className="text-xs text-slate mt-1">
              {(n.equipos_recibidos as unknown as { count: number }[])[0]?.count ?? 0} equipo(s)
            </p>
          </Link>
        ))}
        {(notas ?? []).length === 0 ? (
          <p className="text-slate col-span-full text-center py-8">
            Aún no hay notas de recibo registradas.
          </p>
        ) : null}
      </div>
    </div>
  );
}
