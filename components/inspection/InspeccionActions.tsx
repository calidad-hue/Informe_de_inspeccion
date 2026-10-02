"use client";

import { useState, useTransition } from "react";
import { updateInspeccionDraft, submitInspeccion } from "@/lib/actions/inspecciones";
import { inspeccionDraftFormId } from "./InspeccionDraftForm";

export function InspeccionActions({
  id,
  showSubmitForReview = true,
}: {
  id: string;
  showSubmitForReview?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  async function saveDraft() {
    const form = document.getElementById(inspeccionDraftFormId(id)) as HTMLFormElement | null;
    if (!form) throw new Error("No se encontró el formulario de la inspección");
    await updateInspeccionDraft(id, new FormData(form));
  }

  function handleSave() {
    setMessage(null);
    startTransition(async () => {
      try {
        await saveDraft();
        setMessage({ type: "ok", text: "Borrador guardado" });
      } catch (e) {
        setMessage({ type: "error", text: (e as Error).message });
      }
    });
  }

  function handleSubmitForReview() {
    setMessage(null);
    startTransition(async () => {
      try {
        await saveDraft();
        await submitInspeccion(id);
      } catch (e) {
        setMessage({ type: "error", text: (e as Error).message });
      }
    });
  }

  return (
    <div className="border-t border-neutral-light pt-4 space-y-3">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={pending}
          className="min-h-11 rounded-md bg-carbon text-white px-5 text-sm font-semibold hover:bg-carbon/90 disabled:opacity-50"
        >
          {pending ? "Guardando..." : "Guardar borrador"}
        </button>
        {showSubmitForReview ? (
          <button
            type="button"
            onClick={handleSubmitForReview}
            disabled={pending}
            className="min-h-11 rounded-md bg-industrial text-carbon px-6 text-sm font-semibold hover:brightness-95 disabled:opacity-50"
          >
            Enviar a revisión
          </button>
        ) : null}
      </div>
      {message ? (
        <p className={`text-sm ${message.type === "ok" ? "text-green-700" : "text-red-600"}`}>{message.text}</p>
      ) : null}
    </div>
  );
}
