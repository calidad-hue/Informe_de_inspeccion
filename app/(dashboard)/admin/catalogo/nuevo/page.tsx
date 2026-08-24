import { RepuestoForm } from "@/components/admin/RepuestoForm";
import { createRepuesto } from "@/lib/actions/catalogo";

export default function NuevoRepuestoPage() {
  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-xl font-bold text-carbon">Nuevo repuesto</h1>
      <RepuestoForm action={createRepuesto} submitLabel="Guardar repuesto" />
    </div>
  );
}
