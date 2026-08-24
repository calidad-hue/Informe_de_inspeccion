import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RepuestoForm } from "@/components/admin/RepuestoForm";
import { updateRepuesto } from "@/lib/actions/catalogo";

export default async function EditarRepuestoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: repuesto } = await supabase
    .from("repuestos")
    .select("codigo_pn, categoria, descripcion, diagnostico_comun, solucion_estandar")
    .eq("id", id)
    .single();

  if (!repuesto) {
    notFound();
  }

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-xl font-bold text-carbon">Editar repuesto</h1>
      <RepuestoForm
        action={updateRepuesto.bind(null, id)}
        initialValues={repuesto}
        submitLabel="Guardar cambios"
      />
    </div>
  );
}
