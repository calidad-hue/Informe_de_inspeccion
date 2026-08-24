"use client";

import { useEffect, useRef, useState } from "react";
import { searchRepuestos } from "@/lib/actions/catalogo";
import { addComponente } from "@/lib/actions/inspecciones";

interface RepuestoResult {
  id: string;
  codigo_pn: string;
  categoria: string;
  descripcion: string;
  diagnostico_comun: string | null;
  solucion_estandar: string | null;
}

export function ComponentPicker({ inspeccionId, defaultSeccion }: { inspeccionId: string; defaultSeccion?: string }) {
  const [manual, setManual] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<RepuestoResult[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<RepuestoResult | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (manual || !query.trim()) {
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const data = await searchRepuestos(query.trim());
      setResults(data ?? []);
      setOpen(true);
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, manual]);

  function pick(r: RepuestoResult) {
    setSelected(r);
    setQuery(`${r.codigo_pn} — ${r.descripcion}`);
    setOpen(false);
  }

  async function handleSubmit(formData: FormData) {
    await addComponente(inspeccionId, formData);
    formRef.current?.reset();
    setSelected(null);
    setQuery("");
    setManual(false);
  }

  return (
    <form ref={formRef} action={handleSubmit} className="bg-neutral-light rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-slate">Componente / repuesto</label>
        <button
          type="button"
          onClick={() => {
            setManual((m) => !m);
            setSelected(null);
            setQuery("");
            setResults([]);
          }}
          className="text-xs underline text-slate"
        >
          {manual ? "Buscar en catálogo" : "Ingresar manualmente"}
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate mb-1">Sección</label>
        <input
          name="seccion"
          list="secciones-sugeridas"
          defaultValue={defaultSeccion ?? ""}
          required
          placeholder="Ej. Inspección Visual, Unidad RFL, 1ra etapa..."
          className="w-full min-h-11 rounded-md border border-neutral-light bg-white px-3 text-base text-carbon focus:outline-none focus:ring-2 focus:ring-industrial"
        />
        <datalist id="secciones-sugeridas">
          <option value="Inspección Visual" />
          <option value="Componentes Neumáticos" />
          <option value="Componentes Mecánicos" />
          <option value="1ra etapa" />
          <option value="2da etapa" />
          <option value="3ra etapa" />
          <option value="4ta etapa" />
        </datalist>
      </div>
      <input type="hidden" name="origen" value={manual || !selected ? "manual" : "catalogo"} />
      <input type="hidden" name="repuesto_id" value={selected?.id ?? ""} />

      {!manual ? (
        <div className="relative">
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(null);
            }}
            placeholder="Buscar por P/N o descripción..."
            className="w-full min-h-11 rounded-md border border-neutral-light bg-white px-3 text-base text-carbon focus:outline-none focus:ring-2 focus:ring-industrial"
          />
          {open && query.trim() && results.length > 0 ? (
            <ul className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg border border-neutral-light max-h-56 overflow-auto">
              {results.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => pick(r)}
                    className="w-full text-left px-3 py-2 hover:bg-neutral-light text-sm"
                  >
                    <span className="font-mono text-xs text-slate">{r.codigo_pn}</span> — {r.descripcion}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="grid sm:grid-cols-2 gap-3">
        <TextInput label="P/N" name="codigo_pn" defaultValue={selected?.codigo_pn} disabled={!manual && !selected} />
        <TextInput
          label="Descripción"
          name="descripcion"
          defaultValue={selected?.descripcion}
          disabled={!manual && !selected}
        />
      </div>
      <TextArea
        label="Diagnóstico"
        name="diagnostico"
        defaultValue={selected?.diagnostico_comun ?? ""}
        disabled={!manual && !selected}
      />
      <TextArea
        label="Solución"
        name="solucion"
        defaultValue={selected?.solucion_estandar ?? ""}
        disabled={!manual && !selected}
      />
      <div className="grid sm:grid-cols-2 gap-3">
        <TextInput label="Cantidad" name="cantidad" type="number" defaultValue="1" />
        <div>
          <label className="block text-sm font-medium text-slate mb-1">Fotos de evidencia</label>
          <input
            type="file"
            name="fotos"
            accept="image/*"
            multiple
            capture="environment"
            className="w-full text-sm text-carbon file:mr-3 file:rounded-md file:border-0 file:bg-white file:px-3 file:py-2"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={!manual && !selected}
        className="min-h-11 rounded-md bg-carbon text-white px-4 text-sm font-semibold hover:bg-carbon/90 disabled:opacity-50"
      >
        Agregar hallazgo
      </button>
    </form>
  );
}

function TextInput({
  label,
  name,
  defaultValue,
  disabled,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue?: string;
  disabled?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate mb-1">{label}</label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        key={defaultValue}
        disabled={disabled}
        className="w-full min-h-11 rounded-md border border-neutral-light bg-white px-3 text-base text-carbon focus:outline-none focus:ring-2 focus:ring-industrial disabled:opacity-50"
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
        rows={2}
        defaultValue={defaultValue}
        key={defaultValue}
        disabled={disabled}
        className="w-full rounded-md border border-neutral-light bg-white px-3 py-2 text-base text-carbon focus:outline-none focus:ring-2 focus:ring-industrial disabled:opacity-50"
      />
    </div>
  );
}
