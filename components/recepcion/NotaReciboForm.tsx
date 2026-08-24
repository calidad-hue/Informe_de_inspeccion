"use client";

import { useActionState, useState } from "react";
import { createNotaRecibo, type NotaReciboFormState } from "@/lib/actions/recepcion";

const initialState: NotaReciboFormState = {};

interface EquipoRow {
  key: number;
}

export function NotaReciboForm() {
  const [state, formAction, pending] = useActionState(createNotaRecibo, initialState);
  const [equipos, setEquipos] = useState<EquipoRow[]>([{ key: 0 }]);
  const [nextKey, setNextKey] = useState(1);

  return (
    <form action={formAction} className="space-y-6">
      <section className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <h2 className="font-bold text-carbon">Datos de recepción</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Fecha de recepción" name="fecha_recepcion" type="date" required />
          <Field label="Documento remisorio" name="documento_remisorio" />
          <Field label="Nombre del cliente" name="cliente_nombre" required />
          <Field label="Correo del cliente" name="cliente_correo" type="email" />
          <Field label="Teléfono del cliente" name="cliente_telefono" />
        </div>
        <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-light">
          <Field label="Nombre de quien entrega" name="entrega_nombre" required />
          <Field label="Cédula de quien entrega" name="entrega_cedula" required />
          <Field label="Nombre de quien recibe (MOCER)" name="recibe_nombre" required />
          <Field label="Cédula de quien recibe (MOCER)" name="recibe_cedula" required />
        </div>
        <TextAreaField label="Observaciones" name="observaciones" />
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-carbon">Equipos recibidos</h2>
          <button
            type="button"
            onClick={() => {
              setEquipos((prev) => [...prev, { key: nextKey }]);
              setNextKey((k) => k + 1);
            }}
            className="rounded-md bg-carbon text-white text-sm px-3 py-2 hover:bg-carbon/90"
          >
            + Agregar equipo
          </button>
        </div>
        {equipos.map((eq, idx) => (
          <div key={eq.key} className="bg-white rounded-lg shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate">Equipo {idx + 1}</h3>
              {equipos.length > 1 ? (
                <button
                  type="button"
                  onClick={() => setEquipos((prev) => prev.filter((e) => e.key !== eq.key))}
                  className="text-sm text-red-600 underline"
                >
                  Quitar
                </button>
              ) : null}
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Descripción" name={`equipos[${idx}].descripcion`} required />
              <div>
                <label className="block text-sm font-medium text-slate mb-1">Tipo</label>
                <select
                  name={`equipos[${idx}].equipo_tipo`}
                  required
                  className="w-full min-h-11 rounded-md border border-neutral-light bg-white px-3 text-base text-carbon focus:outline-none focus:ring-2 focus:ring-industrial"
                >
                  <option value="bateria">A batería</option>
                  <option value="electrica">Eléctrica</option>
                  <option value="neumatica">Neumática</option>
                </select>
              </div>
              <Field label="Modelo" name={`equipos[${idx}].modelo`} />
              <Field label="Serial" name={`equipos[${idx}].serial`} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate mb-1">
                Fotos del equipo como llega
              </label>
              <input
                type="file"
                name={`equipos[${idx}].fotos`}
                accept="image/*"
                multiple
                capture="environment"
                className="w-full text-sm text-carbon file:mr-3 file:rounded-md file:border-0 file:bg-neutral-light file:px-3 file:py-2"
              />
            </div>
          </div>
        ))}
        <input type="hidden" name="equipos_count" value={equipos.length} />
      </section>

      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full sm:w-auto min-h-11 px-6 rounded-md bg-industrial text-carbon font-semibold hover:brightness-95 disabled:opacity-50"
      >
        {pending ? "Guardando..." : "Registrar recepción"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  required,
  type = "text",
}: {
  label: string;
  name: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-slate mb-1">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        className="w-full min-h-11 rounded-md border border-neutral-light bg-white px-3 text-base text-carbon focus:outline-none focus:ring-2 focus:ring-industrial"
      />
    </div>
  );
}

function TextAreaField({ label, name }: { label: string; name: string }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-slate mb-1">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        rows={3}
        className="w-full rounded-md border border-neutral-light bg-white px-3 py-2 text-base text-carbon focus:outline-none focus:ring-2 focus:ring-industrial"
      />
    </div>
  );
}
