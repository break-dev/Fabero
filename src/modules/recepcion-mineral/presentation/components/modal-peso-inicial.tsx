import { useState, useEffect } from "react";
import { Select, TextInput, Button, ActionIcon, Tooltip, Stack, Text, Grid, Loader, Group } from "@mantine/core";
import { IconPlus, IconWeight, IconUserPlus } from "@tabler/icons-react";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { FormZonaOrigen } from "../../../../presentation/utils/form-zona-origen";
import { MultiFilePicker } from "../../../../presentation/utils/archivo/multifile-picker";
import { RegistroProveedorMineroSimple } from "../../../../presentation/utils/registro-proveedor-minero-simple";
import { AuxService } from "../../../../service/auxiliar.service";
import type { RES_Proveedor } from "../../../../service/responses/proveedor";
import type { RES_ZonaOrigen } from "../../../../service/responses/zona-origen";
import type { RES_LoteMineral } from "../../service/recepcion-mineral.responses";
import type { DTO_PesoInicial } from "../../service/recepcion-mineral.requests";
import { useNotify } from "../../../../hooks/useNotify";

interface Props {
  lote: RES_LoteMineral;
  onCancel: () => void;
  onSubmit: (loteId: number, dto: DTO_PesoInicial) => Promise<void>;
}

export const ModalPesoInicial = ({ lote, onCancel, onSubmit }: Props) => {
  const { notifyError } = useNotify();

  // Inputs
  const [idProveedor, setIdProveedor] = useState<string | null>(null);
  const [idZona, setIdZona] = useState<string | null>(null);
  const [contacto, setContacto] = useState<string>("");
  const [producto, setProducto] = useState<string | null>(null);
  const [material, setMaterial] = useState<string | null>(null);
  const [pesoInicial, setPesoInicial] = useState<string>("");
  const [evidencias, setEvidencias] = useState<File[]>([]);

  // Catálogos
  const [proveedores, setProveedores] = useState<RES_Proveedor[]>([]);
  const [zonas, setZonas] = useState<RES_ZonaOrigen[]>([]);
  const [loadingCatalogos, setLoadingCatalogos] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Sub-Modals
  const [openZonaModal, setOpenZonaModal] = useState(false);
  const [nuevaZonaNombre, setNuevaZonaNombre] = useState("");
  const [openProveedorModal, setOpenProveedorModal] = useState(false);

  const fetchCatalogos = async () => {
    setLoadingCatalogos(true);
    try {
      const [resProv, resZonas] = await Promise.all([
        AuxService.get_proveedores(),
        AuxService.get_zonas_origen(),
      ]);

      setProveedores(resProv.data || []);
      setZonas(resZonas || []);
    } catch (e) {
      console.error("Error al cargar catálogos de pesaje inicial", e);
    } finally {
      setLoadingCatalogos(false);
    }
  };

  useEffect(() => {
    fetchCatalogos();
  }, []);

  const handleProveedorChange = (val: string | null) => {
    setIdProveedor(val);
    if (val) {
      const p = proveedores.find((x) => String(x.id_proveedor) === val);
      if (p && p.telefono) {
        setContacto(p.telefono);
      } else {
        setContacto("");
      }
    } else {
      setContacto("");
    }
  };

  const handleConfirmar = async () => {
    if (!producto) {
      notifyError("Debe seleccionar el producto.");
      return;
    }
    if (!material) {
      notifyError("Debe seleccionar el tipo de material.");
      return;
    }
    if (!pesoInicial || isNaN(Number(pesoInicial)) || Number(pesoInicial) <= 0) {
      notifyError("Debe ingresar un peso inicial válido y mayor a cero.");
      return;
    }

    setSubmitting(true);
    try {
      const dto: DTO_PesoInicial = {
        id_proveedor_minero: idProveedor ? Number(idProveedor) : null,
        id_zona_origen: idZona ? Number(idZona) : null,
        numero_contacto: contacto,
        tipo_producto: producto,
        tipo_mineral: material,
        peso_inicial: Number(pesoInicial),
        evidencias: evidencias,
      };

      await onSubmit(lote.id, dto);
      onCancel();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreatedProveedor = (nuevo: RES_Proveedor) => {
    setProveedores((prev) => {
      const sinDuplicado = prev.filter((p) => p.id_proveedor !== nuevo.id_proveedor);
      return [nuevo, ...sinDuplicado];
    });
    setIdProveedor(String(nuevo.id_proveedor));
    if (nuevo.telefono) {
      setContacto(nuevo.telefono);
    }
    setOpenProveedorModal(false);
  };

  const fieldClasses = {
    input:
      "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 transition-all",
    label: "text-zinc-400 font-medium text-xs mb-1.5",
  };

  return (
    <>
      <Stack gap="md" className="max-h-[80vh] overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        <Grid gutter="md">
          {/* Columna Izquierda */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Stack gap="md">
              {/* Proveedor Minero */}
              <div>
                <Group gap="xs" align="flex-end" wrap="nowrap">
                  <Select
                    label="Proveedor Minero:"
                    placeholder={loadingCatalogos ? "Cargando..." : "Seleccione proveedor"}
                    searchable
                    disabled={loadingCatalogos}
                    rightSection={loadingCatalogos ? <Loader size={16} /> : undefined}
                    data={proveedores
                      .filter(
                        (p): p is RES_Proveedor & { id_proveedor: number } =>
                          typeof p.id_proveedor === "number",
                      )
                      .map((p) => ({
                        value: String(p.id_proveedor),
                        label: `${p.razon_social} (${p.documento})`,
                      }))}
                    value={idProveedor}
                    onChange={handleProveedorChange}
                    classNames={fieldClasses}
                    radius="lg"
                    className="flex-1"
                  />
                  <Tooltip label="Registrar Proveedor Minero" withArrow>
                    <ActionIcon
                      type="button"
                      variant="filled"
                      color="indigo"
                      radius="lg"
                      size="lg"
                      onClick={() => setOpenProveedorModal(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white h-9.5 w-9.5 mb-0.5"
                    >
                      <IconUserPlus size={16} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </div>

              {/* Producto */}
              <Select
                label="Producto:"
                placeholder="Seleccione"
                data={["Aurífero", "Polimetálico"]}
                value={producto}
                onChange={(val) => setProducto(val)}
                classNames={fieldClasses}
                radius="lg"
                required
              />

              {/* Tipo Material */}
              <Select
                label="Tipo Material:"
                placeholder="Seleccione"
                data={["Mixto", "Óxido", "Sulfuro"]}
                value={material}
                onChange={(val) => setMaterial(val)}
                classNames={fieldClasses}
                radius="lg"
                required
              />
            </Stack>
          </Grid.Col>

          {/* Columna Derecha */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Stack gap="md">
              {/* Zona Origen + Botón Agregar */}
              <Group gap="xs" align="flex-end" wrap="nowrap">
                <Select
                  label="Zona Origen:"
                  placeholder={loadingCatalogos ? "Cargando..." : "Elija una opción..."}
                  searchable
                  disabled={loadingCatalogos}
                  rightSection={loadingCatalogos ? <Loader size={16} /> : undefined}
                  data={zonas.map((z) => ({ value: String(z.id), label: z.nombre }))}
                  value={idZona}
                  onChange={setIdZona}
                  classNames={fieldClasses}
                  radius="lg"
                  className="flex-1"
                />
                <Tooltip label="Agregar Zona de Origen" withArrow>
                  <ActionIcon
                    type="button"
                    variant="filled"
                    color="indigo"
                    radius="lg"
                    size="lg"
                    onClick={() => setOpenZonaModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white mb-0.5"
                  >
                    <IconPlus size={16} />
                  </ActionIcon>
                </Tooltip>
              </Group>

              {/* N° Contacto */}
              <TextInput
                label="N° Contacto:"
                placeholder="Autocompletado con teléfono del proveedor"
                type="tel"
                inputMode="tel"
                maxLength={20}
                value={contacto}
                onChange={(e) => {
                  const sanitizado = e.currentTarget.value.replace(/[^0-9+\-\s()]/g, "");
                  setContacto(sanitizado);
                }}
                onKeyDown={(e) => {
                  if (
                    !/[0-9+\-\s()\bBackspace\bDelete\bArrowLeft\bArrowRight\bTab\bEnter]/.test(e.key)
                  ) {
                    e.preventDefault();
                  }
                }}
                onPaste={(e) => {
                  const textoPegado = e.clipboardData.getData("text");
                  if (/[a-zA-Z]/.test(textoPegado)) {
                    e.preventDefault();
                  }
                }}
                classNames={fieldClasses}
                radius="lg"
              />
            </Stack>
          </Grid.Col>

          {/* Fila inferior de ancho completo */}
          <Grid.Col span={12}>
            <Stack gap="md">
              {/* Peso Inicial */}
              <div className="bg-zinc-950/40 p-4 rounded-2xl border border-zinc-900/80">
                <Text className="text-zinc-300 font-bold text-sm mb-2">Peso Inicial (Kg):</Text>
                <TextInput
                  placeholder="Ingrese peso inicial en Kilos"
                  value={pesoInicial}
                  onChange={(e) => setPesoInicial(e.currentTarget.value.replace(/\D/g, ""))}
                  classNames={{
                    input:
                      "bg-zinc-900/60 border-zinc-800 text-center font-bold text-white focus:border-zinc-300 transition-all",
                  }}
                  radius="lg"
                  autoFocus
                  required
                />
              </div>

              {/* Evidencias */}
              <div className="bg-zinc-900/30 border border-zinc-800/80 p-4 rounded-2xl">
                <MultiFilePicker
                  files={evidencias}
                  onFilesChange={setEvidencias}
                  label="Evidencias de Pesaje Inicial"
                  description="Adjunte imágenes del ingreso de balanza inicial"
                />
              </div>
            </Stack>
          </Grid.Col>
        </Grid>

        {/* Botones de acción */}
        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-zinc-800">
          <Button
            variant="subtle"
            color="gray"
            radius="lg"
            onClick={onCancel}
            disabled={submitting}
            classNames={{ root: "text-zinc-400 hover:bg-zinc-800" }}
          >
            Cerrar
          </Button>
          <Button
            radius="lg"
            loading={submitting}
            onClick={handleConfirmar}
            leftSection={<IconWeight size={18} />}
            className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold shadow-lg shadow-amber-900/20"
          >
            Confirmar
          </Button>
        </div>
      </Stack>

      {/* Sub-Modal: Registro de Nueva Zona de Origen */}
      <ModalEstandar
        opened={openZonaModal}
        close={() => setOpenZonaModal(false)}
        title="Registrar Nueva Zona de Origen"
        size="sm"
      >
        <FormZonaOrigen
          nombre={nuevaZonaNombre}
          setNombre={setNuevaZonaNombre}
          zonasExistentes={zonas}
          onSuccess={(nueva) => {
            setZonas((prev) => [...prev, nueva]);
            setIdZona(String(nueva.id));
            setNuevaZonaNombre("");
            setOpenZonaModal(false);
          }}
        />
      </ModalEstandar>

      {/* Sub-Modal: Registro de Nuevo Proveedor Minero */}
      <ModalEstandar
        opened={openProveedorModal}
        close={() => setOpenProveedorModal(false)}
        title="Registrar Nuevo Proveedor Minero"
        size="lg"
      >
        <RegistroProveedorMineroSimple
          onCancel={() => setOpenProveedorModal(false)}
          onSuccess={handleCreatedProveedor}
        />
      </ModalEstandar>

      </>
  );
};
