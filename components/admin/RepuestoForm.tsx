"use client";

import { useActionState } from "react";
import type { RepuestoFormState } from "@/lib/actions/catalogo";

const initialState: RepuestoFormState = {};

export interface RepuestoFormValues {
  codigo_pn: string;
  categoria: "mecanico" | "electrico" | "estructural";
  descripcion: string;
  diagnostico_comun: string | null;
  solucion_estandar: string | null;
}

export function RepuestoForm({
  action,
  initialValues,
  submitLabel,
}: {
  action: (state: RepuestoFormState, formData: FormData) => Promise<RepuestoFormState>;
  initialValues?: RepuestoFormValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="bg-white rounded-lg shadow-sm p-6 space-y-4">
      <Field label="P/N (código de parte)" name="codigo_pn" defaultValue={initialValues?.codigo_pn} required />
      <div>
        <label className="block text-sm font-medium text-slate mb-1">Categoría</label>
        <select
          name="categoria"
          defaultValue={initialValues?.categoria ?? "mecanico"}
          required
          className="w-full min-h-11 rounded-md border border-neutral-light bg-white px-3 text-base text-carbon focus:outline-none focus:ring-2 focus:ring-industrial"
        >
          <option value="mecanico">Mecánico</option>
          <option value="electrico">Eléctrico</option>
          <option value="estructural">Estructural</option>
        </select>
      </div>
      <Field label="Descripción" name="descripcion" defaultValue={initialValues?.descripcion} required />
      <TextAreaField
        label="Diagnóstico de daño común"
        name="diagnostico_comun"
        defaultValue={initialValues?.diagnostico_comun ?? ""}
      />
      <TextAreaField
        label="Solución estándar"
        name="solucion_estandar"
        defaultValue={initialValues?.solucion_estandar ?? ""}
      />
      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full min-h-11 rounded-md bg-industrial text-carbon font-semibold hover:brightness-95 disabled:opacity-50"
      >
        {pending ? "Guardando..." : submitLabel}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  required,
  defaultValue,
}: {
  label: string;
  name: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-slate mb-1">
        {label}
      </label>
      <input
        id={name}
        name={name}
        required={required}
        defaultValue={defaultValue}
        className="w-full min-h-11 rounded-md border border-neutral-light bg-white px-3 text-base text-carbon focus:outline-none focus:ring-2 focus:ring-industrial"
      />
    </div>
  );
}

function TextAreaField({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-slate mb-1">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        rows={3}
        defaultValue={defaultValue}
        className="w-full rounded-md border border-neutral-light bg-white px-3 py-2 text-base text-carbon focus:outline-none focus:ring-2 focus:ring-industrial"
      />
    </div>
  );
}
