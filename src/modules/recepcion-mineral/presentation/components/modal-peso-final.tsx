import { useState, useEffect } from "react";
import {
  TextInput,
  Button,
  Stack,
  Group,
  Text,
  Grid,
  Select,
  Tooltip,
  ActionIcon,
  Paper,
  Divider,
  Badge,
  Loader,
} from "@mantine/core";
import { IconWeight, IconPlus, IconUserPlus } from "@tabler/icons-react";
import { MultiFilePicker } from "../../../../presentation/utils/archivo/multifile-picker";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { FormZonaOrigen } from "../../../../presentation/utils/form-zona-origen";
import { RegistroProveedorMineroSimple } from "../../../../presentation/utils/registro-proveedor-minero-simple";
import { AuxService } from "../../../../service/auxiliar.service";
import type { RES_Proveedor } from "../../../../service/responses/proveedor";
import type { RES_ZonaOrigen } from "../../../../service/responses/zona-origen";
import type { RES_LoteMineral } from "../../service/recepcion-mineral.responses";
import type { DTO_PesoFinal } from "../../service/recepcion-mineral.requests";
import { useNotify } from "../../../../hooks/useNotify";

interface Props {
  lote: RES_LoteMineral;
  onCancel: () => void;
  onSubmit: (loteId: number, dto: DTO_PesoFinal) => Promise<void>;
}

export const ModalPesoFinal = ({ lote, onCancel, onSubmit }: Props) => {
  const { notifyError } = useNotify();

  // Estados Catálogos
  const [proveedores, setProveedores] = useState<RES_Proveedor[]>([]);
  const [zonas, setZonas] = useState<RES_ZonaOrigen[]>([]);
  const [loadingCatalogos, setLoadingCatalogos] = useState(false);

  // Estados Sub-Modals
  const [openZonaModal, setOpenZonaModal] = useState(false);
  const [openProveedorModal, setOpenProveedorModal] = useState(false);
  const [nuevaZonaNombre, setNuevaZonaNombre] = useState("");

  // Estados Formulario - Peso Inicial (Izquierda)
  const [idProveedor, setIdProveedor] = useState<string | null>(lote.id_proveedor_minero ? String(lote.id_proveedor_minero) : null);
  const [idZona, setIdZona] = useState<string | null>(lote.id_zona_origen ? String(lote.id_zona_origen) : null);
  const [contacto, setContacto] = useState<string>(lote.numero_contacto || "");
  // Producto y Material son opcionales (pueden quedar null en el primer pesaje).
  const [producto, setProducto] = useState<string | null>(lote.tipo_producto ?? null);
  const [material, setMaterial] = useState<string | null>(lote.tipo_mineral ?? null);
  const [pesoInicial, setPesoInicial] = useState<string>(lote.peso_inicial ? String(lote.peso_inicial) : "");

  // Estados Formulario - Peso Final (Derecha)
  const [pesoFinal, setPesoFinal] = useState<string>(lote.peso_final ? String(lote.peso_final) : "");
  const [evidencias, setEvidencias] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);


  // Carga de catálogos
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
      console.error("Error al cargar catálogos en pesaje final", e);
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
      }
    }
  };

  // Valores calculados en tiempo real
  const pesoBruto = pesoInicial ? Number(pesoInicial) : 0;
  const tara = pesoFinal ? Number(pesoFinal) : 0;
  const pesoNeto = pesoBruto - tara;

  const handleConfirmar = async () => {
    if (!pesoBruto || pesoBruto <= 0) {
      notifyError("Debe ingresar un peso inicial válido y mayor a cero.");
      return;
    }

    if (!pesoFinal || isNaN(Number(pesoFinal)) || Number(pesoFinal) <= 0) {
      notifyError("Debe ingresar un peso final (tara) válido.");
      return;
    }

    if (Number(pesoFinal) >= pesoBruto) {
      notifyError("El peso final (tara) no puede ser mayor o igual al peso inicial (bruto).");
      return;
    }

    setSubmitting(true);
    try {
      const dto: DTO_PesoFinal = {
        peso_final: Number(pesoFinal),
        evidencias: evidencias,
        // Enviar datos actualizados de peso inicial
        id_proveedor_minero: idProveedor ? Number(idProveedor) : null,
        id_zona_origen: idZona ? Number(idZona) : null,
        numero_contacto: contacto,
        tipo_producto: producto,
        tipo_mineral: material,
        peso_inicial: pesoBruto,
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
    label: "text-zinc-400 font-medium text-xs mb-1",
  };

  return (
    <>
      <Stack gap="md" className="max-h-[85vh] overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {/* 1. Datos del Pesaje - 2 columnas (md:6) */}
        <Paper radius="xl" p="md" className="bg-zinc-900/20 border border-zinc-800/80">
          <Group gap="xs" mb="xs" pb="xs" className="border-b border-zinc-800">

            <Text size="xs" fw={800} className="text-indigo-400 uppercase tracking-widest">
              Datos del Pesaje
            </Text>
          </Group>

          <Grid gutter="sm">
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Select
                label="Producto:"
                placeholder="Opcional"
                data={["Aurífero", "Polimetálico"]}
                value={producto}
                onChange={(val) => setProducto(val)}
                classNames={fieldClasses}
                radius="lg"
                size="xs"
                clearable
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Select
                label="Tipo Material:"
                placeholder="Opcional"
                data={["Mixto", "Óxido", "Sulfuro"]}
                value={material}
                onChange={(val) => setMaterial(val)}
                classNames={fieldClasses}
                radius="lg"
                size="xs"
                clearable
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Group gap="xs" align="flex-end" wrap="nowrap">
                <Select
                  label="Proveedor Minero:"
                  placeholder={loadingCatalogos ? "Cargando..." : "Seleccione"}
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
                  size="xs"
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
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <IconUserPlus size={16} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Group gap="xs" align="flex-end" wrap="nowrap">
                <Select
                  label="Zona Origen:"
                  placeholder={loadingCatalogos ? "Cargando..." : "Seleccione..."}
                  searchable
                  disabled={loadingCatalogos}
                  rightSection={loadingCatalogos ? <Loader size={16} /> : undefined}
                  data={zonas.map((z) => ({ value: String(z.id), label: z.nombre }))}
                  value={idZona}
                  onChange={setIdZona}
                  classNames={fieldClasses}
                  radius="lg"
                  size="xs"
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
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <IconPlus size={16} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 4 }}>
              <TextInput
                label="N° Contacto:"
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
                size="xs"
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <TextInput
                label="Peso Inicial (Kg):"
                value={pesoInicial}
                onChange={(e) => setPesoInicial(e.currentTarget.value.replace(/\D/g, ""))}
                classNames={fieldClasses}
                radius="lg"
                size="xs"
                required
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <TextInput
                label="Peso Final / Tara (Kg):"
                placeholder="Ingrese tara en Kilos"
                value={pesoFinal}
                onChange={(e) => setPesoFinal(e.currentTarget.value.replace(/\D/g, ""))}
                classNames={fieldClasses}
                radius="lg"
                size="xs"
                autoFocus
                required
              />
            </Grid.Col>
          </Grid>
        </Paper>

        {/* 3. Cálculo de Pesos - 3 badges independientes */}
        <Paper radius="xl" p="xs" className="bg-zinc-950/80 border border-zinc-800/80 shadow-inner">

          <Grid gutter="xs" align="stretch">
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <Badge
                variant="outline"
                color="zinc"
                radius="lg"
                size="xs"
                fullWidth
                styles={{
                  root: {
                    height: "100%",
                    paddingTop: 6,
                    paddingBottom: 6,
                    borderColor: "var(--mantine-color-zinc-8)",
                    backgroundColor: "rgba(24, 24, 27, 0.5)",
                  },
                }}
              >
                <Stack gap={4} align="center">
                  <Text size="xs" fw={700} c="dimmed" tt="uppercase" lts="0.05em">Peso Bruto (Kg)</Text>
                  <Text size="sm" fw={700} c="zinc.2" className="font-mono">{Math.floor(pesoBruto).toLocaleString()}</Text>
                </Stack>
              </Badge>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <Badge
                variant="outline"
                color="zinc"
                radius="lg"
                size="xs"
                fullWidth
                styles={{
                  root: {
                    height: "100%",
                    paddingTop: 6,
                    paddingBottom: 6,
                    borderColor: "var(--mantine-color-zinc-8)",
                    backgroundColor: "rgba(24, 24, 27, 0.5)",
                  },
                }}
              >
                <Stack gap={4} align="center">
                  <Text size="xs" fw={700} c="dimmed" tt="uppercase" lts="0.05em">Tara (Kg)</Text>
                  <Text size="sm" fw={700} c="zinc.2" className="font-mono">{Math.floor(tara).toLocaleString()}</Text>
                </Stack>
              </Badge>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <Badge
                variant="light"
                color="emerald"
                radius="lg"
                size="xs"
                fullWidth
                styles={{
                  root: {
                    height: "100%",
                    paddingTop: 6,
                    paddingBottom: 6,
                    borderColor: "var(--mantine-color-emerald-5)",
                    boxShadow: "0 0 15px rgba(16, 185, 129, 0.15)",
                  },
                }}
              >
                <Stack gap={4} align="center">
                  <Text size="xs" fw={800} c="emerald.4" tt="uppercase" lts="0.1em">Peso Neto (Kg)</Text>
                  <Text size="sm" fw={900} c="emerald.3" className="font-mono">{Math.max(0, Math.floor(pesoNeto)).toLocaleString()}</Text>
                </Stack>
              </Badge>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Evidencias - Fila inferior de ancho completo */}
        <div className="bg-zinc-900/30 border border-zinc-800/80 p-3 rounded-2xl">
          <MultiFilePicker
            files={evidencias}
            onFilesChange={setEvidencias}
            label="Evidencias de Pesaje Final"
            description="Adjunte imágenes del pesaje final"
          />
        </div>

        <Divider my="xs" color="zinc.8" />

        {/* Botones de acción */}
        <Group justify="flex-end" gap="sm">
          <Button
            variant="subtle"
            color="gray"
            radius="lg"
            size="sm"
            onClick={onCancel}
            disabled={submitting}
            classNames={{ root: "text-zinc-400 hover:bg-zinc-800" }}
          >
            Cerrar
          </Button>
          <Button
            radius="lg"
            size="sm"
            loading={submitting}
            onClick={handleConfirmar}
            leftSection={<IconWeight size={18} />}
            className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold shadow-lg shadow-amber-900/20 px-8"
          >
            Confirmar Peso Final
          </Button>
        </Group>
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
