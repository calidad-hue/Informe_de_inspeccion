import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateCompanyHeader, updateGarantiaRecomendaciones, uploadCompanyLogo } from "@/lib/actions/plantillas";

interface CompanyHeader {
  nombre: string;
  nit?: string;
  direccion?: string;
  telefono?: string;
  logo_url?: string;
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

  let logoPreviewUrl: string | null = null;
  if (companyHeader.logo_url) {
    const admin = createAdminClient();
    const { data } = await admin.storage.from("company-assets").createSignedUrl(companyHeader.logo_url, 300);
    logoPreviewUrl = data?.signedUrl ?? null;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-bold text-carbon">Plantillas del informe</h1>

      <section className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <h2 className="font-bold text-carbon">Logo de la empresa</h2>
        {logoPreviewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoPreviewUrl} alt="Logo actual" className="h-20 object-contain" />
        ) : (
          <p className="text-sm text-slate">Aún no se ha cargado un logo. Se usará solo el nombre en el informe.</p>
        )}
        <form action={uploadCompanyLogo} className="flex items-center gap-3">
          <input
            type="file"
            name="logo"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            required
            className="text-sm text-carbon file:mr-3 file:rounded-md file:border-0 file:bg-neutral-light file:px-3 file:py-2"
          />
          <button
            type="submit"
            className="min-h-11 rounded-md bg-industrial text-carbon font-semibold px-4 text-sm hover:brightness-95"
          >
            Subir logo
          </button>
        </form>
      </section>

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
