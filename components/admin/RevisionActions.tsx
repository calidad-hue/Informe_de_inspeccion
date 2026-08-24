"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function RevisionActions({ inspeccionId }: { inspeccionId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  function approve() {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/inspecciones/${inspeccionId}/approve`, { method: "POST" });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "No se pudo aprobar");
        return;
      }
      router.refresh();
    });
  }

  function reject() {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/inspecciones/${inspeccionId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "No se pudo rechazar");
        return;
      }
      setShowReject(false);
      router.refresh();
    });
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 space-y-3">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {!showReject ? (
        <div className="flex flex-wrap gap-3">
          <button
            onClick={approve}
            disabled={pending}
            className="min-h-11 rounded-md bg-industrial text-carbon font-semibold px-6 hover:brightness-95 disabled:opacity-50"
          >
            {pending ? "Procesando..." : "Aprobar y generar PDF"}
          </button>
          <button
            onClick={() => setShowReject(true)}
            disabled={pending}
            className="min-h-11 rounded-md border border-carbon text-carbon px-6 hover:bg-neutral-light disabled:opacity-50"
          >
            Solicitar cambios
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate">Motivo del rechazo</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-neutral-light bg-white px-3 py-2 text-base text-carbon focus:outline-none focus:ring-2 focus:ring-industrial"
          />
          <div className="flex gap-3">
            <button
              onClick={reject}
              disabled={pending || !reason.trim()}
              className="min-h-11 rounded-md bg-carbon text-white px-6 hover:bg-carbon/90 disabled:opacity-50"
            >
              Confirmar rechazo
            </button>
            <button
              onClick={() => setShowReject(false)}
              className="min-h-11 rounded-md border border-neutral-light px-6 text-slate"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
