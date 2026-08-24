import { createClient } from "@/lib/supabase/server";
import { updateCompanyHeader, updateGarantiaRecomendaciones } from "@/lib/actions/plantillas";

interface CompanyHeader {
  nombre: string;
  nit?: string;
  direccion?: string;
  telefono?: string;
}

interface GarantiaRecomendaciones {
  consideraciones_generales: string;
  recomendaciones: string[];
}

export default async function PlantillasPage() {
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("app_settings")
    .select("clave, contenido")
    .in("clave", ["company_header", "garantia_recomendaciones"]);

  const companyHeader = (settings?.find((s) => s.clave === "company_header")?.contenido ??
    {}) as CompanyHeader;
  const garantia = (settings?.find((s) => s.clave === "garantia_recomendaciones")?.contenido ?? {
    consideraciones_generales: "",
    recomendaciones: [],
  }) as GarantiaRecomendaciones;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-bold text-carbon">Plantillas del informe</h1>

      <form action={updateCompanyHeader} className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <h2 className="font-bold text-carbon">Encabezado de empresa</h2>
        <Field label="Nombre" name="nombre" defaultValue={companyHeader.nombre} />
        <Field label="NIT" name="nit" defaultValue={companyHeader.nit} />
        <Field label="Dirección" name="direccion" defaultValue={companyHeader.direccion} />
        <Field label="Teléfono" name="telefono" defaultValue={companyHeader.telefono} />
        <SaveButton />
      </form>

      <form action={updateGarantiaRecomendaciones} className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <h2 className="font-bold text-carbon">Consideraciones de garantía y recomendaciones</h2>
        <TextArea
          label="Consideraciones generales"
          name="consideraciones_generales"
          rows={5}
          defaultValue={garantia.consideraciones_generales}
        />
        <TextArea
          label="Recomendaciones (una por línea)"
          name="recomendaciones"
          rows={6}
          defaultValue={(garantia.recomendaciones ?? []).join("\n")}
        />
        <SaveButton />
      </form>
    </div>
  );
}

function Field({ label, name, defaultValue }: { label: string; name: string; defaultValue?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate mb-1">{label}</label>
      <input
        name={name}
        defaultValue={defaultValue}
        className="w-full min-h-11 rounded-md border border-neutral-light bg-white px-3 text-base text-carbon focus:outline-none focus:ring-2 focus:ring-industrial"
      />
    </div>
  );
}

function TextArea({
  label,
  name,
  defaultValue,
  rows,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  rows: number;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate mb-1">{label}</label>
      <textarea
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        className="w-full rounded-md border border-neutral-light bg-white px-3 py-2 text-base text-carbon focus:outline-none focus:ring-2 focus:ring-industrial"
      />
    </div>
  );
}

function SaveButton() {
  return (
    <button
      type="submit"
      className="min-h-11 rounded-md bg-industrial text-carbon font-semibold px-6 hover:brightness-95"
    >
      Guardar
    </button>
  );
}
