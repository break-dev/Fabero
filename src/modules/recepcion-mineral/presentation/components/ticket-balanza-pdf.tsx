import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { RES_TicketBalanzaData } from "../../service/recepcion-mineral.responses";

// Dimensiones exactas de Ticket Balanza Vertical (67 mm x 247 mm en pt)
// 1 mm = 2.834645669 pt
const TICKET_WIDTH = 189.92;  // 67 mm
const TICKET_HEIGHT = 700.16; // 247 mm

const styles = StyleSheet.create({
  page: {
    width: TICKET_WIDTH,
    height: TICKET_HEIGHT,
    paddingHorizontal: 8,
    paddingVertical: 10,
    backgroundColor: "#ffffff",
    fontFamily: "Courier",
    fontSize: 7.5,
    color: "#000000",
    lineHeight: 1.2,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 2,
  },
  titleBold: {
    fontFamily: "Courier-Bold",
    fontSize: 10,
    textAlign: "center",
  },
  companyBold: {
    fontFamily: "Courier-Bold",
    fontSize: 8.5,
    textAlign: "center",
    marginTop: 2,
    marginBottom: 2,
  },
  addressText: {
    fontSize: 7,
    textAlign: "center",
    color: "#000000",
  },
  ticketNumberBox: {
    marginTop: 3,
    alignItems: "center",
  },
  ticketNumberText: {
    fontFamily: "Courier-Bold",
    fontSize: 9,
  },
  dateText: {
    fontSize: 7.5,
    marginTop: 1,
  },
  boldText: {
    fontFamily: "Courier-Bold",
  },
  dashedLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    borderStyle: "dashed",
    marginVertical: 4,
    width: "100%",
  },
  sectionTitle: {
    fontFamily: "Courier-Bold",
    fontSize: 8,
    marginVertical: 2,
    textAlign: "center",
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    width: "100%",
    marginVertical: 1,
  },
  fieldLabel: {
    fontFamily: "Courier-Bold",
    width: 72,
    flexShrink: 0,
    fontSize: 7.5,
  },
  fieldValue: {
    fontFamily: "Courier",
    flex: 1,
    fontSize: 7.5,
  },
  pesadaBlock: {
    marginVertical: 2,
  },
  pesadaHeader: {
    fontFamily: "Courier-Bold",
    fontSize: 7.5,
    marginBottom: 1,
  },
  pesadaDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginLeft: 4,
    marginVertical: 0.5,
  },
  resumenRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginVertical: 1.5,
  },
  resumenLabel: {
    fontFamily: "Courier-Bold",
    fontSize: 8,
  },
  resumenValor: {
    fontFamily: "Courier-Bold",
    fontSize: 8.5,
    textAlign: "right",
  },
  operadorSection: {
    marginTop: 2,
    width: "100%",
  },
  indentText: {
    marginLeft: 8,
    fontSize: 7.5,
  },
});

const formatFechaHora = (isoString: string | null | undefined): string => {
  if (!isoString) return "";
  const parts = isoString.split(" ");
  if (parts.length === 2) {
    const [d, t] = parts;
    const dateParts = d.split("-");
    if (dateParts.length === 3) {
      return `${dateParts[2]}/${dateParts[1]}/${dateParts[0]} ${t}`;
    }
  }
  return isoString;
};

const formatFechaSolo = (isoString: string | null | undefined): string => {
  if (!isoString) return "";
  const d = isoString.split(" ")[0] ?? isoString;
  const dateParts = d.split("-");
  if (dateParts.length === 3) {
    return `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
  }
  return d;
};

const formatPeso = (peso: number | null | undefined): string => {
  if (peso === null || peso === undefined) return "—";
  return `${Math.round(peso)} kg`;
};

const formatUbicacion = (
  direccion?: string | null,
  nombreSucursal?: string | null,
  distrito?: string | null,
  provincia?: string | null,
  departamento?: string | null
): string => {
  const mainLoc =
    direccion && direccion.trim()
      ? direccion.trim()
      : nombreSucursal && nombreSucursal.trim()
        ? nombreSucursal.trim()
        : null;
  const ubigeo = [distrito, provincia, departamento]
    .filter((p): p is string => Boolean(p && p.trim()))
    .join(" - ");
  if (mainLoc && ubigeo) {
    return `${mainLoc} - ${ubigeo}`;
  }
  return mainLoc ?? ubigeo ?? "—";
};

const formatOrigen = (
  nombreConcesion?: string | null,
  codigoReinfo?: string | null,
  distrito?: string | null,
  provincia?: string | null,
  departamento?: string | null,
  zonaOrigen?: string | null
): string => {
  const ubigeo = [distrito, provincia, departamento]
    .filter((p): p is string => Boolean(p && p.trim()))
    .join(" - ");

  const nombre = nombreConcesion && nombreConcesion.trim() ? nombreConcesion.trim() : null;
  const codigo = codigoReinfo && codigoReinfo.trim() ? codigoReinfo.trim() : null;

  if (nombre || codigo) {
    const identificador = [nombre, codigo].filter(Boolean).join(" - ");
    const cabecera = `${identificador} (CONCESION MINERA)`;
    return ubigeo ? `${cabecera} - ${ubigeo}` : cabecera;
  }

  if (zonaOrigen && zonaOrigen.trim()) {
    return ubigeo ? `${zonaOrigen.trim()} - ${ubigeo}` : zonaOrigen.trim();
  }

  return ubigeo || "—";
};

export interface TicketBalanzaPdfProps {
  data: RES_TicketBalanzaData;
}

export const TicketBalanzaPdf = ({ data }: TicketBalanzaPdfProps) => {
  const observacionText = data.observacion_peso_final || data.observacion_peso_inicial || "";

  return (
    <Document title={`Ticket Balanza ${data.correlativo || data.id_lote}`}>
      <Page size={[TICKET_WIDTH, TICKET_HEIGHT]} orientation="portrait" style={styles.page}>
        {/* ENCABEZADO */}
        <View style={styles.headerContainer}>
          <Text style={styles.titleBold}>TICKET DE PESAJE</Text>
          <Text style={styles.companyBold}>FABRICACIONES FABERO S.A.C</Text>
          <Text style={styles.addressText}>
            {formatUbicacion(
              data.direccion_sucursal,
              data.nombre_sucursal,
              data.distrito_sucursal,
              data.provincia_sucursal,
              data.departamento_sucursal
            )}
          </Text>
          <View style={styles.ticketNumberBox}>
            <Text style={styles.ticketNumberText}>
              N° {data.ticket_numero ?? data.id_lote}
            </Text>
            <Text style={styles.dateText}>
              FECHA: {formatFechaSolo(data.fecha_hora_peso_inicial || data.fecha_impresion || "")}
            </Text>
          </View>
        </View>

        <View style={styles.dashedLine} />

        {/* DATOS GENERALES */}
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>N° PLACA..:</Text>
          <Text style={styles.fieldValue}>{data.placa || "—"}</Text>
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>PRODUCTO..:</Text>
          <Text style={styles.fieldValue}>
            {data.tipo_producto || data.tipo_mineral || "MINERAL AURIFERO EN BRUTO"}
          </Text>
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>GUIA REM..:</Text>
          <Text style={styles.fieldValue}>{data.guia_remision || "—"}</Text>
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>CANT. GR..:</Text>
          <Text style={styles.fieldValue}>{formatPeso(data.peso_neto ?? data.peso_bruto)}</Text>
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>RUC.......:</Text>
          <Text style={styles.fieldValue}>{data.ruc_proveedor ? `[${data.ruc_proveedor}]` : "—"}</Text>
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>PROVEEDOR.:</Text>
          <Text style={styles.fieldValue}>{data.proveedor || "—"}</Text>
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>CONDUCTOR.:</Text>
          <Text style={styles.fieldValue}>
            {data.conductor || "—"}
            {data.licencia_conductor ? ` / [${data.licencia_conductor}]` : ""}
          </Text>
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>TRANSP....:</Text>
          <Text style={styles.fieldValue}>{data.empresa_transporte || "—"}</Text>
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>GUIA TRSP.:</Text>
          <Text style={styles.fieldValue}>{data.guia_transporte || "—"}</Text>
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>DESTINO...:</Text>
          <Text style={styles.fieldValue}>
            {formatUbicacion(
              data.direccion_sucursal,
              data.nombre_sucursal,
              data.distrito_sucursal,
              data.provincia_sucursal,
              data.departamento_sucursal
            )}
          </Text>
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>ORIGEN....:</Text>
          <Text style={styles.fieldValue}>
            {formatOrigen(
              data.nombre_concesion,
              data.codigo_reinfo_concesion,
              data.distrito_concesion,
              data.provincia_concesion,
              data.departamento_concesion,
              data.zona_origen_nombre
            )}
          </Text>
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>LOTE.........:</Text>
          <Text style={styles.fieldValue}>
            {data.correlativo || data.id_lote}
            {observacionText ? ` (${observacionText})` : ""}
          </Text>
        </View>

        <View style={styles.dashedLine} />

        {/* PESAJES */}
        <Text style={styles.sectionTitle}>DETALLE DE PESAJES</Text>

        <View style={styles.pesadaBlock}>
          <Text style={styles.pesadaHeader}>1RA PESADA (BRUTO):</Text>
          <View style={styles.pesadaDetailRow}>
            <Text>{formatFechaHora(data.fecha_hora_peso_inicial)}</Text>
            <Text style={styles.boldText}>{formatPeso(data.peso_bruto)}</Text>
          </View>
        </View>

        {data.fecha_hora_peso_final && (
          <View style={styles.pesadaBlock}>
            <Text style={styles.pesadaHeader}>2DA PESADA (TARA):</Text>
            <View style={styles.pesadaDetailRow}>
              <Text>{formatFechaHora(data.fecha_hora_peso_final)}</Text>
              <Text style={styles.boldText}>{formatPeso(data.peso_tara)}</Text>
            </View>
          </View>
        )}

        <View style={styles.dashedLine} />

        {/* RESUMEN DE PESOS */}
        <Text style={styles.sectionTitle}>RESUMEN DE PESOS</Text>

        <View style={styles.resumenRow}>
          <Text style={styles.resumenLabel}>PESO BRUTO:</Text>
          <Text style={styles.resumenValor}>{formatPeso(data.peso_bruto)}</Text>
        </View>

        <View style={styles.resumenRow}>
          <Text style={styles.resumenLabel}>PESO TARA :</Text>
          <Text style={styles.resumenValor}>{formatPeso(data.peso_tara)}</Text>
        </View>

        <View style={styles.resumenRow}>
          <Text style={styles.resumenLabel}>PESO NETO :</Text>
          <Text style={styles.resumenValor}>{formatPeso(data.peso_neto)}</Text>
        </View>

        <View style={styles.dashedLine} />

        {/* OPERADOR Y FIRMA */}
        <View style={styles.operadorSection}>
          <Text style={styles.boldText}>OPERADOR:</Text>
          <Text style={styles.indentText}>{data.operador || "FABEROSAC RUC 20604623007"}</Text>
          {data.dni_operador && <Text style={styles.indentText}>DNI: {data.dni_operador}</Text>}
          {data.cargo_operador && <Text style={styles.indentText}>{data.cargo_operador}</Text>}
        </View>
      </Page>
    </Document>
  );
};
