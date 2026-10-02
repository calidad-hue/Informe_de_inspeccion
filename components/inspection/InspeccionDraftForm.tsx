"use client";

export function inspeccionDraftFormId(inspeccionId: string) {
  return `inspeccion-draft-${inspeccionId}`;
}

export interface InspeccionDraftValues {
  equipo_edad: string | null;
  accesorios: { brazo_reaccion?: boolean; cargador?: boolean; num_baterias?: number } | null;
  prueba_sentido_giro: string | null;
  prueba_encendido: boolean | null;
  prueba_ruidos: string | null;
  causa_probable_falla: string | null;
  status: string;
  rejected_reason: string | null;
}

export function InspeccionDraftForm({
  id,
  values,
  editable,
}: {
  id: string;
  values: InspeccionDraftValues;
  editable: boolean;
}) {
  return (
    <div className="space-y-4">
      {values.status === "rechazado" && values.rejected_reason ? (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-sm text-red-800">
          <p className="font-semibold">Devuelto por el administrador:</p>
          <p>{values.rejected_reason}</p>
        </div>
      ) : null}

      <form
        id={inspeccionDraftFormId(id)}
        onSubmit={(e) => e.preventDefault()}
        className="bg-white rounded-lg shadow-sm p-6 space-y-4"
      >
        <h2 className="font-bold text-carbon">Recepción y prueba de funcionamiento</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Edad del equipo" name="equipo_edad" defaultValue={values.equipo_edad ?? ""} disabled={!editable} />
          <Field
            label="Sentido de giro (apriete/afloje)"
            name="prueba_sentido_giro"
            defaultValue={values.prueba_sentido_giro ?? ""}
            disabled={!editable}
          />
        </div>

        <div className="flex flex-wrap gap-4 pt-2 border-t border-neutral-light">
          <Checkbox label="Brazo de reacción" name="accesorios.brazo_reaccion" defaultChecked={values.accesorios?.brazo_reaccion} disabled={!editable} />
          <Checkbox label="Cargador" name="accesorios.cargador" defaultChecked={values.accesorios?.cargador} disabled={!editable} />
          <Field
            label="N° de baterías"
            name="accesorios.num_baterias"
            type="number"
            defaultValue={String(values.accesorios?.num_baterias ?? 0)}
            disabled={!editable}
            className="w-32"
          />
          <Checkbox label="Enciende" name="prueba_encendido" defaultChecked={values.prueba_encendido ?? undefined} disabled={!editable} />
        </div>

        <TextArea label="Ruidos observados" name="prueba_ruidos" defaultValue={values.prueba_ruidos ?? ""} disabled={!editable} />
        <TextArea
          label="Posibles causa de la falla"
          name="causa_probable_falla"
          defaultValue={values.causa_probable_falla ?? ""}
          disabled={!editable}
        />
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  disabled,
  type = "text",
  className = "",
}: {
  label: string;
  name: string;
  defaultValue?: string;
  disabled?: boolean;
  type?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-slate mb-1">{label}</label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        disabled={disabled}
        className="w-full min-h-11 rounded-md border border-neutral-light bg-white px-3 text-base text-carbon focus:outline-none focus:ring-2 focus:ring-industrial disabled:opacity-60"
      />
    </div>
  );
}

function TextArea({
  label,
  name,
  defaultValue,
  disabled,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate mb-1">{label}</label>
      <textarea
        name={name}
        rows={3}
        defaultValue={defaultValue}
        disabled={disabled}
        className="w-full rounded-md border border-neutral-light bg-white px-3 py-2 text-base text-carbon focus:outline-none focus:ring-2 focus:ring-industrial disabled:opacity-60"
      />
    </div>
  );
}

function Checkbox({
  label,
  name,
  defaultChecked,
  disabled,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-carbon min-h-11">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        disabled={disabled}
        className="h-5 w-5 accent-industrial"
      />
      {label}
    </label>
  );
}
