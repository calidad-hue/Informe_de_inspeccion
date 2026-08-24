import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

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
  },
  headerTitle: { fontSize: 16, fontWeight: 700, color: COLOR_CARBON },
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
  colSection: { width: "15%" },
  listItem: { fontSize: 10, marginBottom: 3, flexDirection: "row" },
  listBullet: { width: 14 },
  footer: { marginTop: 24, borderTopWidth: 1, borderTopColor: "#DDDDDD", paddingTop: 8 },
});

export interface InspectionReportData {
  companyHeader: { nombre: string; nit?: string; direccion?: string; telefono?: string };
  fechaInforme: string;
  notaRecibo: {
    consecutivo: string;
    fechaRecepcion: string;
    documentoRemisorio?: string;
  };
  cliente: { nombre: string; representante?: string };
  equipo: { descripcion: string; tipo: string; modelo?: string; serial?: string; edad?: string };
  numeroOt: string;
  hallazgos: Array<{
    seccion: string;
    descripcion: string;
    diagnostico?: string;
    solucion?: string;
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
    codigoPn: string;
    cantidad: number;
  }>;
  consideracionesGenerales?: string;
  recomendaciones: string[];
  tecnicoResponsable: string;
}

export function InspectionReportDocument({ data }: { data: InspectionReportData }) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.headerBand}>
          <Text style={styles.headerTitle}>{data.companyHeader.nombre} — Informe de Inspección</Text>
          <View>
            <Text style={styles.headerMeta}>OT: {data.numeroOt}</Text>
            <Text style={styles.headerMeta}>Nota de recibo: {data.notaRecibo.consecutivo}</Text>
            <Text style={styles.headerMeta}>Fecha: {data.fechaInforme}</Text>
          </View>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Cliente</Text>
            <Text style={styles.infoValue}>{data.cliente.nombre}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Representante</Text>
            <Text style={styles.infoValue}>{data.cliente.representante ?? "-"}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Herramienta</Text>
            <Text style={styles.infoValue}>{data.equipo.descripcion} ({data.equipo.tipo})</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Modelo / Serial</Text>
            <Text style={styles.infoValue}>{data.equipo.modelo ?? "-"} / {data.equipo.serial ?? "-"}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Edad del equipo</Text>
            <Text style={styles.infoValue}>{data.equipo.edad ?? "-"}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Documento remisorio</Text>
            <Text style={styles.infoValue}>{data.notaRecibo.documentoRemisorio ?? "-"}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Diagnóstico</Text>
        {groupBySeccion(data.hallazgos).map(([seccion, items]) => (
          <View key={seccion}>
            <Text style={styles.subheading}>{seccion}</Text>
            {items.map((h, idx) => (
              <Text key={idx} style={styles.paragraph}>
                {h.descripcion}
                {h.diagnostico ? ` — ${h.diagnostico}` : ""}
                {h.solucion ? ` (Solución: ${h.solucion})` : ""}
              </Text>
            ))}
          </View>
        ))}

        <Text style={styles.sectionTitle}>Prueba de Funcionamiento</Text>
        <Text style={styles.paragraph}>
          Sentido de giro: {data.pruebaFuncionamiento.sentidoGiro ?? "-"} | Encendido:{" "}
          {data.pruebaFuncionamiento.encendido ? "Sí" : "No"} | Ruidos:{" "}
          {data.pruebaFuncionamiento.ruidos ?? "Ninguno reportado"}
        </Text>

        {data.causaProbableFalla ? (
          <>
            <Text style={styles.sectionTitle}>Posibles Causa de la Falla</Text>
            <Text style={styles.paragraph}>{data.causaProbableFalla}</Text>
          </>
        ) : null}

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
              <Text style={[styles.td, styles.colPn]}>{r.codigoPn}</Text>
              <Text style={[styles.td, styles.colQty]}>{r.cantidad}</Text>
            </View>
          ))}
        </View>

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

function groupBySeccion(hallazgos: InspectionReportData["hallazgos"]) {
  const map = new Map<string, InspectionReportData["hallazgos"]>();
  for (const h of hallazgos) {
    const list = map.get(h.seccion) ?? [];
    list.push(h);
    map.set(h.seccion, list);
  }
  return Array.from(map.entries());
}
