import { renderToBuffer } from "@react-pdf/renderer";
import { createAdminClient } from "@/lib/supabase/admin";
import { InspectionReportDocument, type InspectionReportData } from "./InspectionReportDocument";

const PDF_BUCKET = "inspection-pdfs";

export async function generateAndStoreInspectionPdf(params: {
  inspeccionId: string;
  numeroOt: string;
  data: InspectionReportData;
}) {
  const buffer = await renderToBuffer(InspectionReportDocument({ data: params.data }));

  const admin = createAdminClient();
  const path = `${params.inspeccionId}/${params.numeroOt}.pdf`;

  const { error } = await admin.storage.from(PDF_BUCKET).upload(path, buffer, {
    contentType: "application/pdf",
    upsert: true,
  });

  if (error) {
    throw new Error(`No se pudo subir el PDF a Storage: ${error.message}`);
  }

  return { storagePath: path };
}

export async function createSignedPdfUrl(storagePath: string, expiresInSeconds = 60) {
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(PDF_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error || !data) {
    throw new Error(`No se pudo generar la URL firmada: ${error?.message ?? "sin datos"}`);
  }

  return data.signedUrl;
}
