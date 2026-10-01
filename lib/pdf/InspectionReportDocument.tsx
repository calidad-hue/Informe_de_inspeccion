import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";

const COLOR_CARBON = "#1A1A1A";
const COLOR_SLATE = "#4A4A4A";
const COLOR_INDUSTRIAL = "#FCD116";
const COLOR_NEUTRAL_LIGHT = "#F4F4F4";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, color: COLOR_CARBON, fontFamily: "Helvetica" },
  headerBand: {
    backgroundColor: COLOR_INDUSTRIAL,
    padding: 12,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerLogo: { width: 110, height: 38, objectFit: "contain" },
  headerTitle: { fontSize: 15, fontWeight: 700, color: COLOR_CARBON },
  headerContact: { fontSize: 8, color: COLOR_CARBON },
  headerMeta: { fontSize: 9, color: COLOR_CARBON, textAlign: "right" },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: COLOR_CARBON,
    marginTop: 14,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLOR_INDUSTRIAL,
    paddingBottom: 3,
  },
  subheading: { fontSize: 10, fontWeight: 700, color: COLOR_SLATE, marginTop: 6, marginBottom: 2 },
  paragraph: { fontSize: 10, color: COLOR_CARBON, marginBottom: 4, lineHeight: 1.4 },
  infoGrid: { flexDirection: "row", flexWrap: "wrap", backgroundColor: COLOR_NEUTRAL_LIGHT, padding: 8, borderRadius: 2 },
  infoItem: { width: "50%", marginBottom: 4 },
  infoLabel: { fontSize: 8, color: COLOR_SLATE },
  infoValue: { fontSize: 10, color: COLOR_CARBON, fontWeight: 700 },
  table: { marginTop: 4 },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#DDDDDD" },
  tableHeaderRow: { flexDirection: "row", backgroundColor: COLOR_CARBON },
  th: { color: COLOR_INDUSTRIAL, fontSize: 9, fontWeight: 700, padding: 4 },
  td: { fontSize: 9, color: COLOR_CARBON, padding: 4 },
  colNo: { width: "8%" },
  colDesc: { width: "42%" },
  colPn: { width: "20%" },
  colQty: { width: "15%" },
  listItem: { fontSize: 10, marginBottom: 3, flexDirection: "row" },
  listBullet: { width: 14 },
  footer: { marginTop: 24, borderTopWidth: 1, borderTopColor: "#DDDDDD", paddingTop: 8 },
  photoRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4, marginBottom: 6 },
  photoThumb: { width: 90, height: 90, objectFit: "cover", borderRadius: 2 },
  hallazgoBlock: { marginBottom: 8 },
});

interface Foto {
  url: string;
}

export interface InspectionReportData {
  companyHeader: { nombre: string; nit?: string; direccion?: string; telefono?: string; logoUrl?: string };
  fechaInforme: string;
  notaRecibo: {
    consecutivo: string;
    fechaRecepcion: string;
    documentoRemisorio?: string;
  };
  cliente: { nombre: string };
  equipo: { descripcion: string; tipo: string; modelo?: string; serial?: string; edad?: string };
  numeroOt: string;
  recepcion: {
    observaciones?: string;
    fotos: Foto[];
  };
  hallazgos: Array<{
    seccion: string;
    descripcion: string;
    codigoPn?: string;
    diagnostico?: string;
    recomendacion?: string;
    fotos: Foto[];
  }>;
  pruebaFuncionamiento: {
    sentidoGiro?: string;
    encendido?: boolean;
    ruidos?: string;
  };
  causaProbableFalla?: string;
  repuestos: Array<{
    numero: number;
    descripcion: string;
    codigoPn?: string;
    cantidad: number;
  }>;
  consideracionesGenerales?: string;
  recomendaciones: string[];
  tecnicoResponsable: string;
}

export function InspectionReportDocument({ data }: { data: InspectionReportData }) {
  const contactoPartes = [data.companyHeader.nit && `NIT ${data.companyHeader.nit}`, data.companyHeader.direccion, data.companyHeader.telefono].filter(
    Boolean
  );

  const pruebaPartes: string[] = [];
  if (data.pruebaFuncionamiento.sentidoGiro) pruebaPartes.push(`Sentido de giro: ${data.pruebaFuncionamiento.sentidoGiro}`);
  if (data.pruebaFuncionamiento.encendido !== undefined) {
    pruebaPartes.push(`Encendido: ${data.pruebaFuncionamiento.encendido ? "Sí" : "No"}`);
  }
  if (data.pruebaFuncionamiento.ruidos) pruebaPartes.push(`Ruidos: ${data.pruebaFuncionamiento.ruidos}`);

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.headerBand}>
          <View style={styles.headerLeft}>
            {data.companyHeader.logoUrl ? (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image src={data.companyHeader.logoUrl} style={styles.headerLogo} />
            ) : null}
            <View>
              <Text style={styles.headerTitle}>{data.companyHeader.nombre}</Text>
              <Text style={styles.headerTitle}>Informe de Inspección</Text>
              {contactoPartes.length > 0 ? (
                <Text style={styles.headerContact}>{contactoPartes.join(" · ")}</Text>
              ) : null}
            </View>
          </View>
          <View>
            <Text style={styles.headerMeta}>OT: {data.numeroOt}</Text>
            <Text style={styles.headerMeta}>Nota de recibo: {data.notaRecibo.consecutivo}</Text>
            <Text style={styles.headerMeta}>Fecha: {data.fechaInforme}</Text>
          </View>
        </View>

        <View style={styles.infoGrid}>
          <InfoItem label="Cliente" value={data.cliente.nombre} />
          <InfoItem label="Herramienta" value={`${data.equipo.descripcion} (${data.equipo.tipo})`} />
          {data.equipo.modelo || data.equipo.serial ? (
            <InfoItem
              label="Modelo / Serial"
              value={[data.equipo.modelo, data.equipo.serial].filter(Boolean).join(" / ")}
            />
          ) : null}
          {data.equipo.edad ? <InfoItem label="Edad del equipo" value={data.equipo.edad} /> : null}
        </View>

        {data.notaRecibo.documentoRemisorio || data.recepcion.observaciones || data.recepcion.fotos.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Recepción del Equipo</Text>
            {data.notaRecibo.documentoRemisorio ? (
              <Text style={styles.paragraph}>Documento remisorio: {data.notaRecibo.documentoRemisorio}</Text>
            ) : null}
            {data.recepcion.observaciones ? (
              <Text style={styles.paragraph}>{data.recepcion.observaciones}</Text>
            ) : null}
            <PhotoRow fotos={data.recepcion.fotos} />
          </>
        ) : null}

        {pruebaPartes.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Prueba de Funcionamiento</Text>
            <Text style={styles.paragraph}>{pruebaPartes.join(" | ")}</Text>
          </>
        ) : null}

        {data.hallazgos.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Diagnóstico</Text>
            {groupBySeccion(data.hallazgos).map(([seccion, items]) => (
              <View key={seccion}>
                <Text style={styles.subheading}>{seccion}</Text>
                {items.map((h, idx) => (
                  <View key={idx} style={styles.hallazgoBlock}>
                    <Text style={styles.paragraph}>
                      {h.codigoPn ? `${h.codigoPn} — ` : ""}
                      {h.descripcion}
                      {h.diagnostico ? `: ${h.diagnostico}` : ""}
                    </Text>
                    {h.recomendacion ? (
                      <Text style={styles.paragraph}>Recomendación: {h.recomendacion}</Text>
                    ) : null}
                    <PhotoRow fotos={h.fotos} />
                  </View>
                ))}
              </View>
            ))}
          </>
        ) : null}

        {data.causaProbableFalla ? (
          <>
            <Text style={styles.sectionTitle}>Posibles Causa de la Falla</Text>
            <Text style={styles.paragraph}>{data.causaProbableFalla}</Text>
          </>
        ) : null}

        {data.repuestos.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Listado de Repuestos</Text>
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.th, styles.colNo]}>N°</Text>
                <Text style={[styles.th, styles.colDesc]}>Descripción</Text>
                <Text style={[styles.th, styles.colPn]}>P/N</Text>
                <Text style={[styles.th, styles.colQty]}>Cantidad</Text>
              </View>
              {data.repuestos.map((r) => (
                <View key={r.numero} style={styles.tableRow}>
                  <Text style={[styles.td, styles.colNo]}>{r.numero}</Text>
                  <Text style={[styles.td, styles.colDesc]}>{r.descripcion}</Text>
                  <Text style={[styles.td, styles.colPn]}>{r.codigoPn ?? ""}</Text>
                  <Text style={[styles.td, styles.colQty]}>{r.cantidad}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {data.consideracionesGenerales ? (
          <>
            <Text style={styles.sectionTitle}>Consideraciones Generales - Notas</Text>
            <Text style={styles.paragraph}>{data.consideracionesGenerales}</Text>
          </>
        ) : null}

        {data.recomendaciones.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Recomendaciones</Text>
            {data.recomendaciones.map((r, idx) => (
              <View key={idx} style={styles.listItem}>
                <Text style={styles.listBullet}>{idx + 1}.</Text>
                <Text>{r}</Text>
              </View>
            ))}
          </>
        ) : null}

        <View style={styles.footer}>
          <Text style={styles.paragraph}>Técnico Encargado de la Inspección: {data.tecnicoResponsable}</Text>
        </View>
      </Page>
    </Document>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoItem}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function PhotoRow({ fotos }: { fotos: Foto[] }) {
  if (fotos.length === 0) return null;
  return (
    <View style={styles.photoRow}>
      {fotos.map((f, idx) => (
        // eslint-disable-next-line jsx-a11y/alt-text
        <Image key={idx} src={f.url} style={styles.photoThumb} />
      ))}
    </View>
  );
}

function groupBySeccion(hallazgos: InspectionReportData["hallazgos"]) {
  const map = new Map<string, InspectionReportData["hallazgos"]>();
  for (const h of hallazgos) {
    const list = map.get(h.seccion) ?? [];
    list.push(h);
    map.set(h.seccion, list);
  }
  return Array.from(map.entries());
}
