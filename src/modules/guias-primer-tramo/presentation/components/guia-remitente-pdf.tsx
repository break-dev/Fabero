import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import type { RES_GuiaPrimerTramo } from "../../service/guias-primer-tramo.responses";

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 28,
    paddingVertical: 25,
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
    fontSize: 8,
    color: "#1f2937",
    lineHeight: 1.35,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    alignItems: "stretch",
  },
  logoCol: {
    width: "15%",
    justifyContent: "center",
    alignItems: "flex-start",
  },
  qrImage: {
    width: 72,
    height: 72,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 5,
  },
  infoCol: {
    width: "45%",
    paddingLeft: 10,
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  providerName: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    marginBottom: 3,
  },
  emissionDate: {
    fontSize: 8,
    color: "#4b5563",
    marginTop: 10,
  },
  rucCol: {
    width: "38%",
    borderWidth: 1,
    borderColor: "#000000",
    borderRadius: 5,
    padding: 8,
    textAlign: "center",
    justifyContent: "center",
    alignItems: "center",
  },
  rucText: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    marginBottom: 1.5,
    color: "#000000",
  },
  docTitle: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    marginBottom: 1.5,
    color: "#000000",
  },
  docSubtitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
    color: "#000000",
  },
  docNumber: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
  },
  rowInfo: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    paddingVertical: 4.5,
    alignItems: "flex-start",
  },
  col50: {
    width: "50%",
    paddingRight: 8,
  },
  labelBold: {
    fontFamily: "Helvetica-Bold",
    color: "#374151",
  },
  valueText: {
    color: "#111827",
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    marginTop: 12,
    marginBottom: 5,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  table: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 4,
    overflow: "hidden",
    marginVertical: 4,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
    alignItems: "center",
    paddingVertical: 4.5,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    alignItems: "center",
    paddingVertical: 4.5,
  },
  colNum: {
    width: "5%",
    textAlign: "center",
    fontFamily: "Helvetica-Bold",
  },
  colNormalizado: {
    width: "10%",
    textAlign: "center",
  },
  colCodigo: {
    width: "10%",
    textAlign: "center",
  },
  colSunat: {
    width: "10%",
    textAlign: "center",
  },
  colArancel: {
    width: "10%",
    textAlign: "center",
  },
  colGtin: {
    width: "8%",
    textAlign: "center",
  },
  colDesc: {
    width: "32%",
    paddingHorizontal: 4,
  },
  colUnidad: {
    width: "10%",
    textAlign: "center",
  },
  colCant: {
    width: "10%",
    textAlign: "right",
    paddingRight: 4,
    fontFamily: "Helvetica-Bold",
  },
  thText: {
    fontSize: 7.2,
    fontFamily: "Helvetica-Bold",
    color: "#374151",
    textAlign: "center",
  },
  tdText: {
    fontSize: 7.8,
    color: "#4b5563",
  },
  footerSection: {
    marginTop: 5,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 4,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 1.5,
  },
  legalDisclaimer: {
    fontSize: 7,
    color: "#9ca3af",
    textAlign: "justify",
    marginTop: 25,
    lineHeight: 1.25,
  },
});

export interface GuiaRemitentePdfProps {
  guia: RES_GuiaPrimerTramo;
  qrCodeUrl: string;
}

export const GuiaRemitentePdf = ({ guia, qrCodeUrl }: GuiaRemitentePdfProps) => {
  const fullGuiaNumber =
    guia.serie_guia_remitente || guia.numero_guia_remitente
      ? `${guia.serie_guia_remitente ?? "—"}-${guia.numero_guia_remitente ?? "—"}`
      : "—";

  const rucProveedor = guia.proveedor_documento || "—";
  const razonSocialProveedor = (guia.proveedor_razon_social || "PROVEEDOR MINERO").toUpperCase();

  // Calcular el total del peso neto (Cantidad) sumando los lotes asociados
  const lotesList = guia.lotes || [];
  const totalPesoNeto = lotesList.reduce((acc, curr) => {
    const peso = curr.peso_neto !== null ? curr.peso_neto : (curr.peso_bruto ?? 0) - (curr.tara ?? 0);
    return acc + peso;
  }, 0);

  // Formatear peso neto total
  const totalPesoNetoFormateado = totalPesoNeto.toFixed(2);

  return (
    <Document title={`Guía Remitente ${fullGuiaNumber}`}>
      <Page size="A4" orientation="portrait" style={styles.page}>
        
        {/* Encabezado Principal */}
        <View style={styles.headerContainer}>
          <View style={styles.logoCol}>
            {qrCodeUrl ? (
              <Image src={qrCodeUrl} style={styles.qrImage} />
            ) : (
              <View style={[styles.qrImage, { backgroundColor: "#f3f4f6" }]} />
            )}
          </View>

          <View style={styles.infoCol}>
            <Text style={styles.providerName}>{razonSocialProveedor}</Text>
            <Text style={styles.emissionDate}>
              <Text style={styles.labelBold}>Fecha y hora de emisión: </Text>
              {guia.fecha_emision || "—"}
            </Text>
          </View>

          <View style={styles.rucCol}>
            <Text style={styles.rucText}>RUC N° {rucProveedor}</Text>
            <Text style={styles.docTitle}>GUÍA DE REMISIÓN ELECTRÓNICA</Text>
            <Text style={styles.docSubtitle}>REMITENTE</Text>
            <Text style={styles.docNumber}>N° {fullGuiaNumber}</Text>
          </View>
        </View>

        {/* Datos de Traslado */}
        <View style={styles.rowInfo}>
          <View style={styles.col50}>
            <Text>
              <Text style={styles.labelBold}>Fecha de Inicio de Traslado: </Text>
              <Text style={styles.valueText}>{guia.fecha_inicio_traslado ? guia.fecha_inicio_traslado.slice(0, 10) : "—"}</Text>
            </Text>
          </View>
          <View style={styles.col50}>
            <Text>
              <Text style={styles.labelBold}>Punto de Partida: </Text>
              <Text style={styles.valueText}>—</Text>
            </Text>
          </View>
        </View>

        <View style={styles.rowInfo}>
          <View style={styles.col50}>
            <Text>
              <Text style={styles.labelBold}>Motivo de Traslado: </Text>
              <Text style={styles.valueText}>{(guia.motivo_traslado || "OTROS").toUpperCase()}</Text>
            </Text>
          </View>
          <View style={styles.col50}>
            <Text>
              <Text style={styles.labelBold}>Punto de Llegada: </Text>
              <Text style={styles.valueText}>—</Text>
            </Text>
          </View>
        </View>

        <View style={styles.rowInfo}>
          <View style={styles.col50}>
            <Text>
              <Text style={styles.labelBold}>Descripción de Motivo: </Text>
              <Text style={styles.valueText}>SERVICIO DE CHANCADO</Text>
            </Text>
          </View>
        </View>

        {/* Datos del Destinatario */}
        <View style={styles.rowInfo}>
          <View style={{ width: "100%" }}>
            <Text>
              <Text style={styles.labelBold}>Datos del Destinatario: </Text>
              <Text style={styles.valueText}>FABERO S.A.C. - REGISTRO ÚNICO DE CONTRIBUYENTES N° —</Text>
            </Text>
          </View>
        </View>

        {/* Sección Bienes por Transportar */}
        <Text style={styles.sectionTitle}>Bienes por Transportar</Text>
        
        <View style={styles.table}>
          {/* Header */}
          <View style={styles.tableHeader}>
            <View style={styles.colNum}><Text style={styles.thText}>N°</Text></View>
            <View style={styles.colNormalizado}><Text style={styles.thText}>BIEN NORM.</Text></View>
            <View style={styles.colCodigo}><Text style={styles.thText}>CÓD. BIEN</Text></View>
            <View style={styles.colSunat}><Text style={styles.thText}>CÓD. SUNAT</Text></View>
            <View style={styles.colArancel}><Text style={styles.thText}>PART. ARAN.</Text></View>
            <View style={styles.colGtin}><Text style={styles.thText}>GTIN</Text></View>
            <View style={styles.colDesc}><Text style={styles.thText}>DESCRIPCIÓN DETALLADA</Text></View>
            <View style={styles.colUnidad}><Text style={styles.thText}>U. MEDIDA</Text></View>
            <View style={styles.colCant}><Text style={styles.thText}>CANTIDAD</Text></View>
          </View>

          {/* Body */}
          {lotesList.length > 0 ? (
            lotesList.map((l, index) => {
              const pesoLote = l.peso_neto !== null ? l.peso_neto : (l.peso_bruto ?? 0) - (l.tara ?? 0);
              const desc = l.tipo_producto 
                ? `${l.tipo_producto.toUpperCase()} - LOTE: ${l.lote_correlativo || ""}`
                : `MINERAL AURÍFERO EN BRUTO SIN PROCESAR - LOTE: ${l.lote_correlativo || ""}`;

              return (
                <View key={l.id || index} style={styles.tableRow}>
                  <View style={styles.colNum}><Text style={[styles.tdText, { textAlign: "center", fontFamily: "Helvetica-Bold" }]}>{index + 1}</Text></View>
                  <View style={styles.colNormalizado}><Text style={[styles.tdText, { textAlign: "center" }]}>NO</Text></View>
                  <View style={styles.colCodigo}><Text style={[styles.tdText, { textAlign: "center" }]}>—</Text></View>
                  <View style={styles.colSunat}><Text style={[styles.tdText, { textAlign: "center" }]}>—</Text></View>
                  <View style={styles.colArancel}><Text style={[styles.tdText, { textAlign: "center" }]}>—</Text></View>
                  <View style={styles.colGtin}><Text style={[styles.tdText, { textAlign: "center" }]}>—</Text></View>
                  <View style={styles.colDesc}><Text style={styles.tdText}>{desc}</Text></View>
                  <View style={styles.colUnidad}><Text style={[styles.tdText, { textAlign: "center" }]}>TONELADAS</Text></View>
                  <View style={styles.colCant}><Text style={[styles.tdText, { textAlign: "right" }]}>{pesoLote.toFixed(2)}</Text></View>
                </View>
              );
            })
          ) : (
            <View style={styles.tableRow}>
              <View style={styles.colNum}><Text style={[styles.tdText, { textAlign: "center" }]}>1</Text></View>
              <View style={styles.colNormalizado}><Text style={[styles.tdText, { textAlign: "center" }]}>NO</Text></View>
              <View style={styles.colCodigo}><Text style={[styles.tdText, { textAlign: "center" }]}>—</Text></View>
              <View style={styles.colSunat}><Text style={[styles.tdText, { textAlign: "center" }]}>—</Text></View>
              <View style={styles.colArancel}><Text style={[styles.tdText, { textAlign: "center" }]}>—</Text></View>
              <View style={styles.colGtin}><Text style={[styles.tdText, { textAlign: "center" }]}>—</Text></View>
              <View style={styles.colDesc}><Text style={styles.tdText}>MINERAL AURÍFERO EN BRUTO SIN PROCESAR</Text></View>
              <View style={styles.colUnidad}><Text style={[styles.tdText, { textAlign: "center" }]}>TONELADAS</Text></View>
              <View style={styles.colCant}><Text style={[styles.tdText, { textAlign: "right" }]}>0.00</Text></View>
            </View>
          )}
        </View>

        {/* Resumen de Pesos */}
        <View style={styles.footerRow}>
          <Text>
            <Text style={styles.labelBold}>Unidad de Medida del Peso Bruto: </Text>
            <Text style={styles.valueText}>TNE</Text>
          </Text>
        </View>
        <View style={styles.footerRow}>
          <Text>
            <Text style={styles.labelBold}>Peso Bruto total de la carga: </Text>
            <Text style={styles.valueText}>{totalPesoNetoFormateado}</Text>
          </Text>
        </View>

        {/* Datos Adicionales del Traslado */}
        <Text style={styles.sectionTitle}>Datos del traslado</Text>
        <View style={styles.footerSection}>
          <View style={styles.footerRow}>
            <View style={{ width: "50%" }}>
              <Text>
                <Text style={styles.labelBold}>Modalidad de Traslado: </Text>
                <Text style={styles.valueText}>Público</Text>
              </Text>
            </View>
            <View style={{ width: "50%" }}>
              <Text>
                <Text style={styles.labelBold}>Indicador de retorno de vehículo con envases vacíos: </Text>
                <Text style={styles.valueText}>NO</Text>
              </Text>
            </View>
          </View>

          <View style={styles.footerRow}>
            <View style={{ width: "50%" }}>
              <Text>
                <Text style={styles.labelBold}>Indicador de traslado en vehículos de cat. M1 o L: </Text>
                <Text style={styles.valueText}>NO</Text>
              </Text>
            </View>
            <View style={{ width: "50%" }}>
              <Text>
                <Text style={styles.labelBold}>Reg. vehículos y conductores del transportista: </Text>
                <Text style={styles.valueText}>SI</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* Datos del Transportista */}
        <Text style={styles.sectionTitle}>Datos del transportista</Text>
        <View style={styles.footerSection}>
          <View style={styles.footerRow}>
            <Text>
              <Text style={styles.labelBold}>Razón Social / RUC: </Text>
              <Text style={styles.valueText}>
                {guia.empresa_transporte_razon_social 
                  ? `${guia.empresa_transporte_razon_social.toUpperCase()} - REGISTRO ÚNICO DE CONTRIBUYENTES N° —`
                  : "—"}
              </Text>
            </Text>
          </View>
          <View style={styles.footerRow}>
            <Text>
              <Text style={styles.labelBold}>Número de registro del MTC: </Text>
              <Text style={styles.valueText}>—</Text>
            </Text>
          </View>
        </View>

        {/* Datos de los Vehículos */}
        <Text style={styles.sectionTitle}>Datos de los vehículos</Text>
        <View style={styles.footerSection}>
          <View style={styles.footerRow}>
            <View style={{ width: "20%" }}>
              <Text style={styles.labelBold}>Principal:</Text>
            </View>
            <View style={{ width: "80%" }}>
              <Text>
                <Text style={styles.labelBold}>Número de placa: </Text>
                <Text style={styles.valueText}>
                  {guia.vehiculo_placa ? guia.vehiculo_placa.toUpperCase() : "—"}
                </Text>
              </Text>
              <Text style={{ marginTop: 2 }}>
                <Text style={styles.labelBold}>Número de TUCE o Certificado Habilitación: </Text>
                <Text style={styles.valueText}>—</Text>
              </Text>
            </View>
          </View>

          {guia.vehiculo_carreta_placa && (
            <View style={[styles.footerRow, { marginTop: 4 }]}>
              <View style={{ width: "20%" }}>
                <Text style={styles.labelBold}>Secundario 1:</Text>
              </View>
              <View style={{ width: "80%" }}>
                <Text>
                  <Text style={styles.labelBold}>Número de placa: </Text>
                  <Text style={styles.valueText}>
                    {guia.vehiculo_carreta_placa.toUpperCase()}
                  </Text>
                </Text>
                <Text style={{ marginTop: 2 }}>
                  <Text style={styles.labelBold}>Número de TUCE o Certificado Habilitación: </Text>
                  <Text style={styles.valueText}>—</Text>
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Datos de los Conductores */}
        <Text style={styles.sectionTitle}>Datos de los conductores</Text>
        <View style={styles.footerSection}>
          <View style={styles.footerRow}>
            <View style={{ width: "20%" }}>
              <Text style={styles.labelBold}>Principal:</Text>
            </View>
            <View style={{ width: "80%" }}>
              <Text style={styles.valueText}>
                {guia.conductor_nombre ? guia.conductor_nombre.toUpperCase() : "—"} 
                {guia.conductor_dni ? ` - DOCUMENTO NACIONAL DE IDENTIDAD N° ${guia.conductor_dni}` : ""}
              </Text>
              <Text style={{ marginTop: 2 }}>
                <Text style={styles.labelBold}>Número de licencia de conducir: </Text>
                <Text style={styles.valueText}>{guia.conductor_licencia || "—"}</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* Observaciones */}
        <Text style={styles.sectionTitle}>Observación</Text>
        <View style={styles.footerSection}>
          <Text style={styles.valueText}>
            <Text style={styles.labelBold}>CONCESIÓN: </Text>
            {guia.concesion_nombre ? guia.concesion_nombre.toUpperCase() : "—"}
            <Text style={styles.labelBold}> / C.U.: </Text>
            —
          </Text>
        </View>

        {/* Disclaimer Legal */}
        <Text style={styles.legalDisclaimer}>
          Esta es una representación impresa sin valor tributario de la Guía de Remisión Electrónica generada en el sistema de la SUNAT. Este es solo un borrador generado por el ERP de Operaciones de G.E.L.
        </Text>

      </Page>
    </Document>
  );
};
