"use client";

import { useState, useTransition } from "react";

export function InlineEditableField({
  value,
  onSave,
  className,
  inputClassName,
}: {
  value: string;
  onSave: (newValue: string) => Promise<void>;
  className?: string;
  inputClassName?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!editing) {
    return (
      <span className={className}>
        {value}{" "}
        <button
          type="button"
          onClick={() => {
            setDraft(value);
            setError(null);
            setEditing(true);
          }}
          className="text-xs underline text-slate align-middle"
        >
          Editar
        </button>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 flex-wrap">
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        className={
          inputClassName ??
          "min-h-9 rounded-md border border-neutral-light bg-white px-2 text-sm text-carbon focus:outline-none focus:ring-2 focus:ring-industrial"
        }
        autoFocus
      />
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            try {
              await onSave(draft);
              setEditing(false);
            } catch (e) {
              setError((e as Error).message);
            }
          });
        }}
        className="text-xs font-semibold rounded-md bg-carbon text-white px-2 py-1 disabled:opacity-50"
      >
        {pending ? "Guardando..." : "Guardar"}
      </button>
      <button
        type="button"
        onClick={() => setEditing(false)}
        className="text-xs text-slate underline"
      >
        Cancelar
      </button>
      {error ? <span className="text-xs text-red-600 w-full">{error}</span> : null}
    </span>
  );
}
