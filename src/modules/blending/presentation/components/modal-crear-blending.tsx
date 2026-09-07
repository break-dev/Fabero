import React, { useState } from "react";
import {
  Group,
  Stack,
  Button,
  Select,
  NumberInput,
  Text,
  Table,
  ActionIcon,
  Textarea,
  Loader,
  Paper,
  Box,
} from "@mantine/core";
import {
  IconPlus,
  IconMinus,
  IconSearch,
  IconSparkles,
  IconX,
  IconCheck,
  IconLayersIntersect,
} from "@tabler/icons-react";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { DateTimePicker } from "@mantine/dates";
import { MultiFilePicker } from "../../../../presentation/utils/archivo/multifile-picker";
import { useBlendingDisponibles } from "../../hooks/useBlendingDisponibles";
import { useRegistroBlending } from "../../hooks/useRegistroBlending";
import { ModalMejorCombinacion } from "./modal-mejor-combinacion";
import { formatNumber } from "../../../../shared/functions/formatNumber";

interface ModalCrearBlendingProps {
  opened: boolean;
  close: () => void;
  onSuccess: () => void;
}

export const ModalCrearBlending: React.FC<ModalCrearBlendingProps> = ({
  opened,
  close,
  onSuccess,
}) => {
  const [modalOptimizacionAbierto, setModalOptimizacionAbierto] = useState<boolean>(false);

  const {
    disponibles,
    proveedores,
    empresas,
    idProveedorSeleccionado,
    setIdProveedorSeleccionado,
    idEmpresaSeleccionada,
    setIdEmpresaSeleccionada,
    loadingDisponibles,
    loadingProveedores,
    loadingEmpresas,
    refetchDisponibles,
    limpiarDisponibles,
  } = useBlendingDisponibles();

  const {
    seleccionados,
    fechaHoraBlending,
    setFechaHoraBlending,
    observacion,
    setObservacion,
    evidenciasFiles,
    setEvidenciasFiles,
    precioOro,
    setPrecioOro,
    precioPlata,
    setPrecioPlata,
    valoresEstimados,
    agregarItem,
    removerItem,
    setPesoTomado,
    aplicarMejorCombinacion,
    resetForm,
    submit,
    loading,
  } = useRegistroBlending(() => {
    onSuccess();
    limpiarDisponibles();
    close();
  });

  const fieldClasses = {
    input:
      "bg-zinc-900/50 border-zinc-800 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 text-white placeholder:text-zinc-500 transition-all",
    label: "text-zinc-300 mb-1 font-medium",
  };

  const handleCloseModal = () => {
    resetForm();
    limpiarDisponibles();
    close();
  };

  return (
    <>
      <ModalEstandar
        opened={opened}
        close={handleCloseModal}
        title={
          <Group gap="xs">
            <IconLayersIntersect size={22} className="text-emerald-400" />
            <Text fw={700} fz="lg" c="white">
              Crear Nuevo Blending
            </Text>
          </Group>
        }
        rightSection={
          <Group gap="xs" align="center">
            <Box w={160}>
              <DateTimePicker
                placeholder="Fecha y Hora"
                value={fechaHoraBlending}
                onChange={(val) => setFechaHoraBlending(val as Date | null)}
                valueFormat="DD/MM/YYYY HH:mm"
                size="xs"
                radius="lg"
                classNames={fieldClasses}
              />
            </Box>
            <Select
              placeholder={loadingEmpresas ? "Cargando..." : "Seleccionar Empresa"}
              disabled={loadingEmpresas || seleccionados.length > 0}
              rightSection={loadingEmpresas ? <Loader size={14} /> : undefined}
              allowDeselect={false}
              searchable
              comboboxProps={{ withinPortal: true }}
              data={empresas.map((e) => ({
                value: String(e.id_empresa),
                label: e.razon_social,
              }))}
              value={idEmpresaSeleccionada ? String(idEmpresaSeleccionada) : null}
              onChange={(val) => setIdEmpresaSeleccionada(val ? Number(val) : null)}
              size="xs"
              radius="lg"
              w={200}
              classNames={fieldClasses}
              description={
                seleccionados.length > 0
                  ? "Fija mientras haya lotes seleccionados. Vacíe la lista para cambiar."
                  : undefined
              }
            />
            <Select
              placeholder={loadingProveedores ? "Cargando..." : "Filtrar por Proveedor (Opcional)"}
              disabled={loadingProveedores}
              rightSection={loadingProveedores ? <Loader size={14} /> : undefined}
              clearable
              searchable
              comboboxProps={{ withinPortal: true }}
              data={proveedores.map((p) => ({
                value: String(p.id_proveedor),
                label: `${p.razon_social} (${p.documento || ""})`,
              }))}
              value={idProveedorSeleccionado ? String(idProveedorSeleccionado) : null}
              onChange={(val) => setIdProveedorSeleccionado(val ? Number(val) : null)}
              size="xs"
              radius="lg"
              w={220}
              classNames={fieldClasses}
            />
            <Button
              color="blue"
              size="xs"
              radius="lg"
              onClick={refetchDisponibles}
              loading={loadingDisponibles}
              leftSection={<IconSearch size={14} />}
            >
              Buscar Lotes
            </Button>
          </Group>
        }
        size="75rem"
        validateClose={seleccionados.length > 0}
        closeConfirmationTitle="¿Descartar creación de blending?"
        closeConfirmationMessage="Tienes lotes seleccionados en la mezcla. Si cierras, se perderán las selecciones."
      >
        <Stack gap="lg" p="xs">
          <button
            data-autofocus
            className="sr-only opacity-0 w-0 h-0 p-0 m-0 pointer-events-none absolute -z-50"
            tabIndex={-1}
            aria-hidden="true"
          />
          {/* Sección Lotes Disponibles */}
          <Stack gap="xs">
            <Text fw={700} fz="sm" c="zinc.2">
              Lotes Disponibles:
            </Text>
            <Paper className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
              <Table striped highlightOnHover verticalSpacing="xs" horizontalSpacing="sm">
                <Table.Thead className="bg-zinc-900/90 text-zinc-300">
                  <Table.Tr>
                    <Table.Th className="text-left">Empresa</Table.Th>
                    <Table.Th className="text-left">Proveedor</Table.Th>
                    <Table.Th className="text-center">Código</Table.Th>
                    <Table.Th className="text-right">TMH (Peso Húmedo)</Table.Th>
                    <Table.Th className="text-right">H2O (Humedad)</Table.Th>
                    <Table.Th className="text-right">TMS (Peso Seco)</Table.Th>
                    <Table.Th className="text-right">Ley Au</Table.Th>
                    <Table.Th className="text-right">Ley Ag</Table.Th>
                    <Table.Th className="text-center" w={60}>
                      Acción
                    </Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {loadingDisponibles ? (
                    <Table.Tr>
                      <Table.Td colSpan={9} className="text-center py-6 text-zinc-400">
                        <Group justify="center" gap="xs">
                          <Loader size={18} />
                          <Text fz="xs">Cargando lotes disponibles...</Text>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ) : disponibles.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={9} className="text-center py-6 text-zinc-500">
                        No hay lotes ni blendings disponibles con stock actual.
                      </Table.Td>
                    </Table.Tr>
                  ) : (
                    disponibles.map((item, idx) => {
                      const yaSeleccionado = seleccionados.some((s) =>
                        item.tipo_origen === "lote"
                          ? s.item.id_lote_mineral === item.id_lote_mineral
                          : s.item.id_reblending === item.id_reblending
                      );

                      return (
                        <Table.Tr key={`${item.tipo_origen}-${item.codigo}-${idx}`}>
                          <Table.Td className="font-medium text-zinc-300">
                            {item.empresa_nombre || "-"}
                          </Table.Td>
                          <Table.Td className="font-medium text-zinc-200">
                            {item.tipo_origen === "blending" ? "Blending" : item.proveedor_nombre}
                          </Table.Td>
                          <Table.Td className="text-center font-bold text-zinc-100">
                            {item.codigo}
                          </Table.Td>
                          <Table.Td className="text-right text-zinc-300">
                            {formatNumber(item.tmh_disponible, 2)}
                          </Table.Td>
                          <Table.Td className="text-right text-zinc-300">
                            {formatNumber(item.ley_humedad, 3)}
                          </Table.Td>
                          <Table.Td className="text-right font-bold text-emerald-400">
                            {formatNumber(item.tms_disponible, 2)}
                          </Table.Td>
                          <Table.Td className="text-right text-zinc-300">
                            {formatNumber(item.ley_oro, 2)}
                          </Table.Td>
                          <Table.Td className="text-right text-zinc-300">
                            {formatNumber(item.ley_plata, 2)}
                          </Table.Td>
                          <Table.Td className="text-center">
                            <ActionIcon
                              color="teal"
                              variant="filled"
                              size="sm"
                              radius="md"
                              disabled={yaSeleccionado}
                              onClick={() => agregarItem(item)}
                            >
                              <IconPlus size={16} />
                            </ActionIcon>
                          </Table.Td>
                        </Table.Tr>
                      );
                    })
                  )}
                </Table.Tbody>
              </Table>
            </Paper>
          </Stack>

          {/* Sección Lotes Seleccionados */}
          <Stack gap="xs">
            <Text fw={700} fz="sm" c="zinc.2">
              Lotes Seleccionados:
            </Text>
            <Paper className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
              <Table striped highlightOnHover verticalSpacing="xs" horizontalSpacing="sm">
                <Table.Thead className="bg-emerald-950/40 text-emerald-200">
                  <Table.Tr>
                    <Table.Th className="text-left">Proveedor</Table.Th>
                    <Table.Th className="text-center">Código</Table.Th>
                    <Table.Th className="text-right">TMH (Disponible)</Table.Th>
                    <Table.Th className="text-right">H2O (Humedad)</Table.Th>
                    <Table.Th className="text-right">TMS (Disponible)</Table.Th>
                    <Table.Th className="text-right">Ley Au</Table.Th>
                    <Table.Th className="text-right">Ley Ag</Table.Th>
                    <Table.Th className="text-right" w={160}>
                      Peso a Tomar (kg)
                    </Table.Th>
                    <Table.Th className="text-center" w={60}>
                      Acción
                    </Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {seleccionados.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={9} className="text-center py-6 text-zinc-500">
                        Haga clic en (+) en la tabla superior para agregar lotes a la mezcla.
                      </Table.Td>
                    </Table.Tr>
                  ) : (
                    seleccionados.map(({ item, peso_tomado }, idx) => (
                      <Table.Tr key={`sel-${item.codigo}-${idx}`}>
                        <Table.Td className="font-medium text-zinc-200">
                          {item.tipo_origen === "blending" ? "Blending" : item.proveedor_nombre}
                        </Table.Td>
                        <Table.Td className="text-center font-bold text-zinc-100">
                          {item.codigo}
                        </Table.Td>
                        <Table.Td className="text-right text-zinc-300">
                          {formatNumber(item.tmh_disponible, 2)}
                        </Table.Td>
                        <Table.Td className="text-right text-zinc-300">
                          {formatNumber(item.ley_humedad, 3)}
                        </Table.Td>
                        <Table.Td className="text-right font-bold text-emerald-400">
                          {formatNumber(item.tms_disponible, 2)}
                        </Table.Td>
                        <Table.Td className="text-right text-zinc-300">
                          {formatNumber(item.ley_oro, 2)}
                        </Table.Td>
                        <Table.Td className="text-right text-zinc-300">
                          {formatNumber(item.ley_plata, 2)}
                        </Table.Td>
                        <Table.Td className="text-right">
                          <NumberInput
                            value={peso_tomado}
                            onChange={(val) => setPesoTomado(item, typeof val === "number" ? val : 0)}
                            min={0.01}
                            max={item.tmh_disponible}
                            decimalScale={2}
                            hideControls
                            size="xs"
                            radius="md"
                            classNames={fieldClasses}
                          />
                        </Table.Td>
                        <Table.Td className="text-center">
                          <ActionIcon
                            color="red"
                            variant="filled"
                            size="sm"
                            radius="md"
                            onClick={() => removerItem(item)}
                          >
                            <IconMinus size={16} />
                          </ActionIcon>
                        </Table.Td>
                      </Table.Tr>
                    ))
                  )}
                </Table.Tbody>
              </Table>
            </Paper>
          </Stack>

          {/* PROMEDIOS FÍSICOS Y LEYES DE MEZCLA */}
          <Paper className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-xl">
            <Stack gap="xs">
              <Group justify="space-between" align="center">
                <Text fw={700} fz="xs" c="zinc.4" className="uppercase tracking-wider">
                  PROMEDIOS FÍSICOS Y LEYES DE MEZCLA
                </Text>
                <Button
                  color="amber"
                  variant="light"
                  size="xs"
                  radius="lg"
                  leftSection={<IconSparkles size={16} />}
                  onClick={() => setModalOptimizacionAbierto(true)}
                >
                  Mejor Combinación
                </Button>
              </Group>

              <Group justify="space-around" align="center" className="py-1">
                {/* PESO HUMEDO */}
                <Stack gap={2} align="center">
                  <Text fw={800} fz="1.4rem" className="text-blue-400">
                    {formatNumber(valoresEstimados.pesoHumedoTotal, 2)}
                  </Text>
                  <Text fz="xs" fw={700} c="zinc.4" className="uppercase">
                    PESO HÚMEDO (kg)
                  </Text>
                </Stack>

                {/* HUMEDAD % */}
                <Stack gap={2} align="center">
                  <Text fw={800} fz="1.4rem" className="text-cyan-400">
                    {formatNumber(valoresEstimados.leyHumedad, 3)}%
                  </Text>
                  <Text fz="xs" fw={700} c="zinc.4" className="uppercase">
                    HUMEDAD %
                  </Text>
                </Stack>

                {/* PESO SECO */}
                <Stack gap={2} align="center">
                  <Text fw={800} fz="1.4rem" className="text-emerald-400">
                    {formatNumber(valoresEstimados.pesoSecoTotal, 2)}
                  </Text>
                  <Text fz="xs" fw={700} c="zinc.4" className="uppercase">
                    PESO SECO (tms)
                  </Text>
                </Stack>

                {/* LEY AU */}
                <Stack gap={2} align="center">
                  <Text fw={800} fz="1.4rem" className="text-amber-400">
                    {formatNumber(valoresEstimados.leyOro, 4)}
                  </Text>
                  <Text fz="xs" fw={700} c="zinc.4" className="uppercase">
                    LEY AU (Oro)
                  </Text>
                </Stack>

                {/* LEY AG */}
                <Stack gap={2} align="center">
                  <Text fw={800} fz="1.4rem" className="text-zinc-300">
                    {formatNumber(valoresEstimados.leyPlata, 4)}
                  </Text>
                  <Text fz="xs" fw={700} c="zinc.4" className="uppercase">
                    LEY AG (Plata)
                  </Text>
                </Stack>
              </Group>
            </Stack>
          </Paper>

          {/* VALORIZACIÓN COMERCIAL ESTIMADA */}
          <Paper className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-xl">
            <Stack gap="sm">
              <Text fw={700} fz="xs" c="zinc.4" className="uppercase tracking-wider">
                VALORIZACIÓN COMERCIAL ESTIMADA (OPCIONAL)
              </Text>

              <Group justify="space-between" align="center" gap="md" wrap="nowrap">
                {/* ORO */}
                <Paper className="bg-zinc-950/60 border border-amber-900/30 p-3 rounded-lg flex-1">
                  <Stack gap="xs">
                    <Text fw={700} fz="xs" c="amber.4" className="uppercase">
                      Oro (Au)
                    </Text>
                    <Group justify="space-between" align="flex-end">
                      <Box className="w-40">
                        <NumberInput
                          label="Precio Oro ($/oz)"
                          placeholder="0.00"
                          value={precioOro}
                          onChange={(val) => setPrecioOro(typeof val === "number" ? val : 0)}
                          decimalScale={2}
                          min={0}
                          size="xs"
                          radius="md"
                          classNames={fieldClasses}
                        />
                      </Box>
                      <Stack gap={0} align="flex-end">
                        <Text fz={10} c="zinc.5" fw={600} className="uppercase">
                          Subtotal Oro:
                        </Text>
                        <Text fw={800} fz="sm" className="text-amber-400">
                          $ {formatNumber(valoresEstimados.valorAuEstimado, 2)} USD
                        </Text>
                      </Stack>
                    </Group>
                  </Stack>
                </Paper>

                {/* PLATA */}
                <Paper className="bg-zinc-950/60 border border-zinc-800 p-3 rounded-lg flex-1">
                  <Stack gap="xs">
                    <Text fw={700} fz="xs" c="zinc.3" className="uppercase">
                      Plata (Ag)
                    </Text>
                    <Group justify="space-between" align="flex-end">
                      <Box className="w-40">
                        <NumberInput
                          label="Precio Plata ($/oz)"
                          placeholder="0.00"
                          value={precioPlata}
                          onChange={(val) => setPrecioPlata(typeof val === "number" ? val : 0)}
                          decimalScale={2}
                          min={0}
                          size="xs"
                          radius="md"
                          classNames={fieldClasses}
                        />
                      </Box>
                      <Stack gap={0} align="flex-end">
                        <Text fz={10} c="zinc.5" fw={600} className="uppercase">
                          Subtotal Plata:
                        </Text>
                        <Text fw={800} fz="sm" className="text-zinc-200">
                          $ {formatNumber(valoresEstimados.valorAgEstimado, 2)} USD
                        </Text>
                      </Stack>
                    </Group>
                  </Stack>
                </Paper>

                {/* TOTAL COMERCIAL */}
                <Paper className="bg-emerald-950/30 border border-emerald-800/40 p-3.5 rounded-lg w-64 text-right">
                  <Stack gap={2} align="flex-end" justify="center">
                    <Text fz={10} c="emerald.4" fw={700} className="uppercase tracking-wider">
                      VALOR COMERCIAL TOTAL ESTIMADO:
                    </Text>
                    <Text fw={800} fz="1.25rem" className="text-emerald-400">
                      $ {formatNumber(valoresEstimados.valorTotalEstimado, 2)} USD
                    </Text>
                  </Stack>
                </Paper>
              </Group>
            </Stack>
          </Paper>

          {/* Observación opcional */}
          <Textarea
            label="Observación / Anotación"
            placeholder="Ingrese comentarios u observaciones del blending (opcional)"
            value={observacion}
            onChange={(e) => setObservacion(e.currentTarget.value)}
            rows={2}
            size="xs"
            radius="lg"
            classNames={fieldClasses}
          />

          {/* Evidencias / Adjuntos */}
          <MultiFilePicker
            label="Evidencias / Adjuntos del Blending"
            description="Imágenes o documentos adjuntos (PDF, JPG, PNG, etc.)"
            files={evidenciasFiles}
            onFilesChange={setEvidenciasFiles}
            multiple
          />

          {/* Acciones */}
          <Group justify="end" gap="xs" mt="xs">
            <Button
              variant="default"
              size="xs"
              radius="lg"
              onClick={handleCloseModal}
              leftSection={<IconX size={14} />}
            >
              Cancelar
            </Button>
            <Button
              color="emerald"
              size="xs"
              radius="lg"
              onClick={submit}
              loading={loading}
              leftSection={<IconCheck size={14} />}
            >
              Crear Blending
            </Button>
          </Group>
        </Stack>
      </ModalEstandar>

      {/* Modal Mejor Combinación */}
      <ModalMejorCombinacion
        opened={modalOptimizacionAbierto}
        close={() => setModalOptimizacionAbierto(false)}
        onAplicar={(leyMinOro, leyMinPlata, pesoMax, capMaxPorLote, precioOro, precioPlata) =>
          aplicarMejorCombinacion(
            seleccionados.map((s) => s.item),
            leyMinOro,
            leyMinPlata,
            pesoMax,
            capMaxPorLote,
            precioOro,
            precioPlata,
          )
        }
      />
    </>
  );
};

export default ModalCrearBlending;
