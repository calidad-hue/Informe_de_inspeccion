import { NotaReciboForm } from "@/components/recepcion/NotaReciboForm";

export default function NuevaNotaReciboPage() {
  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-xl font-bold text-carbon">Nueva Nota de Recibo</h1>
      <NotaReciboForm />
    </div>
  );
}
