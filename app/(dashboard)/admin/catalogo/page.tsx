import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { toggleRepuestoActivo } from "@/lib/actions/catalogo";

export default async function CatalogoPage() {
  const supabase = await createClient();
  const { data: repuestos } = await supabase
    .from("repuestos")
    .select("id, codigo_pn, categoria, descripcion, activo")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-carbon">Catálogo de Repuestos</h1>
        <Link
          href="/admin/catalogo/nuevo"
          className="rounded-md bg-industrial text-carbon font-semibold px-4 py-2 hover:brightness-95"
        >
          + Nuevo repuesto
        </Link>
      </div>

      <div className="bg-white rounded-lg overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-carbon text-white text-left">
            <tr>
              <th className="px-4 py-2">P/N</th>
              <th className="px-4 py-2">Categoría</th>
              <th className="px-4 py-2">Descripción</th>
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {(repuestos ?? []).map((r) => (
              <tr key={r.id} className="border-b border-neutral-light last:border-0">
                <td className="px-4 py-2 font-mono">{r.codigo_pn}</td>
                <td className="px-4 py-2 capitalize">{r.categoria}</td>
                <td className="px-4 py-2">{r.descripcion}</td>
                <td className="px-4 py-2">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      r.activo ? "bg-green-100 text-green-800" : "bg-neutral-light text-slate"
                    }`}
                  >
                    {r.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-2 text-right space-x-3">
                  <Link href={`/admin/catalogo/${r.id}/editar`} className="text-carbon underline">
                    Editar
                  </Link>
                  <form
                    action={async () => {
                      "use server";
                      await toggleRepuestoActivo(r.id, !r.activo);
                    }}
                    className="inline"
                  >
                    <button type="submit" className="text-slate underline">
                      {r.activo ? "Desactivar" : "Activar"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {(repuestos ?? []).length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate">
                  Aún no hay repuestos en el catálogo.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
