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
  mtcRegister: {
    fontSize: 8,
    color: "#4b5563",
    marginTop: 2,
  },
  emissionDate: {
    fontSize: 8,
    color: "#4b5563",
    marginTop: 6,
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

export interface GuiaTransportistaPdfProps {
  guia: RES_GuiaPrimerTramo;
  qrCodeUrl: string;
  rucTransportista?: string | null;
}

export const GuiaTransportistaPdf = ({ guia, qrCodeUrl, rucTransportista }: GuiaTransportistaPdfProps) => {
  const fullGuiaNumber = guia.guia_transportista ?? "—";
  const fullGuiaRemitente = guia.guia_remitente ?? "—";

  const rucProveedor = guia.proveedor_documento || "—";
  const razonSocialProveedor = (guia.proveedor_razon_social || "PROVEEDOR MINERO").toUpperCase();
  const razonSocialTransportista = (guia.empresa_transporte_razon_social || "EMPRESA DE TRANSPORTE").toUpperCase();

  // Calcular el total del peso neto sumando los lotes/particiones asociadas
  const lotesList = guia.lotes || [];
  const totalPesoNeto = lotesList.reduce((acc, curr) => {
    const peso = curr.peso_neto !== null ? curr.peso_neto : 0;
    return acc + peso;
  }, 0);

  const totalPesoNetoFormateado = totalPesoNeto.toFixed(2);

  return (
    <Document title={`Guía Transportista ${fullGuiaNumber}`}>
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
            <Text style={styles.providerName}>{razonSocialTransportista}</Text>
            <Text style={styles.mtcRegister}>
              <Text style={styles.labelBold}>Número de registro del MTC: </Text>
              —
            </Text>
            <Text style={styles.emissionDate}>
              <Text style={styles.labelBold}>Fecha y hora de emisión: </Text>
              {guia.fecha_emision || "—"}
            </Text>
          </View>

          <View style={styles.rucCol}>
            <Text style={styles.rucText}>RUC N° {rucTransportista || "—"}</Text>
            <Text style={styles.docTitle}>GUÍA DE REMISIÓN ELECTRÓNICA</Text>
            <Text style={styles.docSubtitle}>TRANSPORTISTA</Text>
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
            {/* Espacio vacío para mantener simetría con la plantilla original */}
          </View>
          <View style={styles.col50}>
            <Text>
              <Text style={styles.labelBold}>Punto de Llegada: </Text>
              <Text style={styles.valueText}>—</Text>
            </Text>
          </View>
        </View>

        {/* Datos de Remitente y Destinatario */}
        <View style={styles.rowInfo}>
          <View style={{ width: "100%" }}>
            <Text>
              <Text style={styles.labelBold}>Datos del Remitente: </Text>
              <Text style={styles.valueText}>{razonSocialProveedor} - REGISTRO ÚNICO DE CONTRIBUYENTES N° {rucProveedor}</Text>
            </Text>
          </View>
        </View>

        <View style={styles.rowInfo}>
          <View style={{ width: "100%" }}>
            <Text>
              <Text style={styles.labelBold}>Datos del Destinatario: </Text>
              <Text style={styles.valueText}>FABERO S.A.C. - REGISTRO ÚNICO DE CONTRIBUYENTES N° —</Text>
            </Text>
          </View>
        </View>

        {/* Documentos Relacionados */}
        <Text style={styles.sectionTitle}>Documentos Relacionados</Text>
        <View style={styles.footerSection}>
          <View style={styles.footerRow}>
            <Text style={styles.valueText}>
              Guía de Remisión Remitente N° {fullGuiaRemitente} - RUC N° {rucProveedor}
            </Text>
          </View>
        </View>

        {/* Bienes por Transportar */}
        <Text style={styles.sectionTitle}>Bienes por Transportar</Text>
        <View style={styles.footerSection}>
          <View style={styles.footerRow}>
            <Text style={styles.valueText}>
              MINERAL AURÍFERO EN BRUTO SIN PROCESAR (CONSOLIDADO DE LOTES ASOCIADOS)
            </Text>
          </View>
          <View style={[styles.footerRow, { marginTop: 4 }]}>
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
        </View>

        {/* Datos Adicionales del Traslado */}
        <Text style={styles.sectionTitle}>Datos del traslado</Text>
        <View style={styles.footerSection}>
          <View style={styles.footerRow}>
            <View style={{ width: "50%" }}>
              <Text>
                <Text style={styles.labelBold}>Indicador de transbordo programado: </Text>
                <Text style={styles.valueText}>NO</Text>
              </Text>
            </View>
            <View style={{ width: "50%" }}>
              <Text>
                <Text style={styles.labelBold}>Indicador de retorno de vehículo vacío: </Text>
                <Text style={styles.valueText}>NO</Text>
              </Text>
            </View>
          </View>

          <View style={styles.footerRow}>
            <View style={{ width: "50%" }}>
              <Text>
                <Text style={styles.labelBold}>Indicador de retorno con envases vacíos: </Text>
                <Text style={styles.valueText}>NO</Text>
              </Text>
            </View>
            <View style={{ width: "50%" }}>
              <Text>
                <Text style={styles.labelBold}>Indicador de Transporte subcontratado: </Text>
                <Text style={styles.valueText}>NO</Text>
              </Text>
            </View>
          </View>

          <View style={styles.footerRow}>
            <View style={{ width: "100%" }}>
              <Text>
                <Text style={styles.labelBold}>Indicador del pagador del flete: </Text>
                <Text style={styles.valueText}>Sin pagador de flete</Text>
              </Text>
            </View>
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
