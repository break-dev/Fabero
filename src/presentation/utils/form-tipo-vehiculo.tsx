import { useState } from "react";
import {
  Table,
  Button,
  TextInput,
  Group,
  ActionIcon,
  Tooltip,
  Badge,
  Loader,
  Text,
  Stack,
  Card,
  Switch,
} from "@mantine/core";
import {
  IconPencil,
  IconPower,
  IconDeviceFloppy,
  IconPlus,
  IconX,
} from "@tabler/icons-react";
import { useTiposVehiculo } from "../../hooks/useTiposVehiculo";
import { EstadoBase } from "../../shared/enums/_generic/estado-base";
import type { RES_TipoVehiculo } from "../../service/responses/tipo-vehiculo";

interface Props {
  onSelectTipoVehiculo?: (id: number) => void;
}

export const FormTipoVehiculo = ({ onSelectTipoVehiculo }: Props) => {
  const {
    tiposVehiculo,
    loading,
    loadingById,
    addTipoVehiculo,
    updateTipoVehiculo,
    toggleEstadoTipoVehiculo,
  } = useTiposVehiculo();

  const [nombre, setNombre] = useState("");
  const [tieneCarreta, setTieneCarreta] = useState(false);
  const [esCarreta, setEsCarreta] = useState(false);

  const [editingTipo, setEditingTipo] = useState<RES_TipoVehiculo | null>(
    null,
  );
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    setSaving(true);
    try {
      if (editingTipo) {
        await updateTipoVehiculo(
          editingTipo.id_tipo_vehiculo,
          nombre.trim(),
          tieneCarreta,
          esCarreta,
        );
        setEditingTipo(null);
      } else {
        const created = await addTipoVehiculo(
          nombre.trim(),
          tieneCarreta,
          esCarreta,
        );
        if (onSelectTipoVehiculo && created) {
          onSelectTipoVehiculo(created.id_tipo_vehiculo);
        }
      }
      setNombre("");
      setTieneCarreta(false);
      setEsCarreta(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (tipo: RES_TipoVehiculo) => {
    setEditingTipo(tipo);
    setNombre(tipo.nombre);
    setTieneCarreta(tipo.tiene_carreta);
    setEsCarreta(tipo.es_carreta);
  };

  const handleCancelEdit = () => {
    setEditingTipo(null);
    setNombre("");
    setTieneCarreta(false);
    setEsCarreta(false);
  };

  return (
    <Stack gap="md" className="p-1">
      <Card
        withBorder
        padding="md"
        radius="lg"
        className="bg-zinc-900/30 border-zinc-800"
      >
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <TextInput
              label={
                editingTipo
                  ? "Editar Nombre del Tipo"
                  : "Nuevo Tipo de Vehículo"
              }
              placeholder="Ej. Semirremolque, Camioneta, Furgón"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              radius="xl"
              classNames={{
                input:
                  "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 transition-all",
                label: "text-zinc-400 font-medium text-xs mb-1.5",
              }}
            />
            <Group justify={editingTipo ? "space-between" : "flex-end"} align="center" mt="xs">
              {editingTipo && (
                <Group gap="xl">
                  <Switch
                    label="¿Tiene Carreta?"
                    checked={tieneCarreta}
                    onChange={(e) => setTieneCarreta(e.currentTarget.checked)}
                    size="sm"
                    color="indigo"
                    classNames={{
                      label: "text-zinc-400 font-medium text-xs cursor-pointer",
                    }}
                  />
                  <Switch
                    label="¿Es Carreta?"
                    checked={esCarreta}
                    onChange={(e) => setEsCarreta(e.currentTarget.checked)}
                    size="sm"
                    color="indigo"
                    classNames={{
                      label: "text-zinc-400 font-medium text-xs cursor-pointer",
                    }}
                  />
                </Group>
              )}
              <Group gap="xs">
                {editingTipo && (
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    size="lg"
                    radius="xl"
                    onClick={handleCancelEdit}
                    className="hover:bg-zinc-800"
                  >
                    <IconX size={18} />
                  </ActionIcon>
                )}
                <Button
                  type="submit"
                  loading={saving}
                  radius="xl"
                  leftSection={
                    editingTipo ? (
                      <IconDeviceFloppy size={16} />
                    ) : (
                      <IconPlus size={16} />
                    )
                  }
                  className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20"
                >
                  {editingTipo ? "Actualizar" : "Agregar"}
                </Button>
              </Group>
            </Group>
          </Stack>
        </form>
      </Card>

      {loading ? (
        <Group justify="center" py="xl">
          <Loader size="sm" color="indigo" />
        </Group>
      ) : tiposVehiculo.length === 0 ? (
        <Text size="sm" c="dimmed" ta="center" py="lg">
          No hay tipos de vehículo registrados.
        </Text>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-800/80 bg-zinc-950/20 max-h-[300px] custom-scrollbar">
          <Table verticalSpacing="sm" className="min-w-full text-zinc-300">
            <Table.Thead className="bg-zinc-900/40 border-b border-zinc-800">
              <Table.Tr>
                <Table.Th className="text-zinc-400 font-semibold text-xs py-3 px-4">
                  #
                </Table.Th>
                <Table.Th className="text-zinc-400 font-semibold text-xs py-3 px-4">
                  Nombre
                </Table.Th>
                <Table.Th className="text-zinc-400 font-semibold text-xs py-3 px-4 text-center">
                  Tiene Carreta
                </Table.Th>
                <Table.Th className="text-zinc-400 font-semibold text-xs py-3 px-4 text-center">
                  Es Carreta
                </Table.Th>
                <Table.Th className="text-zinc-400 font-semibold text-xs py-3 px-4 text-center">
                  Estado
                </Table.Th>
                <Table.Th className="text-zinc-400 font-semibold text-xs py-3 px-4 text-center">
                  Acciones
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {tiposVehiculo.map((tipo, idx) => (
                <Table.Tr
                  key={tipo.id_tipo_vehiculo}
                  className="border-b border-zinc-800/60 hover:bg-zinc-900/10"
                >
                  <Table.Td className="py-2.5 px-4 text-sm text-zinc-500">
                    {idx + 1}
                  </Table.Td>
                  <Table.Td className="py-2.5 px-4 text-sm font-medium text-white">
                    {tipo.nombre}
                  </Table.Td>
                  <Table.Td className="py-2.5 px-4 text-center">
                    <Badge
                      color={tipo.tiene_carreta ? "indigo" : "gray"}
                      variant="light"
                      size="xs"
                    >
                      {tipo.tiene_carreta ? "Sí" : "No"}
                    </Badge>
                  </Table.Td>
                  <Table.Td className="py-2.5 px-4 text-center">
                    <Badge
                      color={tipo.es_carreta ? "teal" : "gray"}
                      variant="light"
                      size="xs"
                    >
                      {tipo.es_carreta ? "Sí" : "No"}
                    </Badge>
                  </Table.Td>
                  <Table.Td className="py-2.5 px-4 text-center">
                    <Badge
                      color={
                        tipo.estado === EstadoBase.Activo ? "green" : "gray"
                      }
                      variant="light"
                      size="sm"
                      radius="lg"
                    >
                      {tipo.estado}
                    </Badge>
                  </Table.Td>
                  <Table.Td className="py-2.5 px-4">
                    <Group gap="xs" justify="center" wrap="nowrap">
                      <Tooltip label="Editar Tipo" withArrow>
                        <ActionIcon
                          variant="subtle"
                          color="blue"
                          radius="xl"
                          size="sm"
                          onClick={() => handleEdit(tipo)}
                          disabled={tipo.estado === EstadoBase.Inactivo}
                        >
                          <IconPencil size={16} stroke={1.5} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip
                        label={
                          tipo.estado === EstadoBase.Activo
                            ? "Inactivar"
                            : "Activar"
                        }
                        withArrow
                      >
                        <ActionIcon
                          variant="subtle"
                          color={
                            tipo.estado === EstadoBase.Activo
                              ? "orange"
                              : "green"
                          }
                          radius="xl"
                          size="sm"
                          loading={!!loadingById[tipo.id_tipo_vehiculo]}
                          disabled={!!loadingById[tipo.id_tipo_vehiculo]}
                          onClick={() =>
                            toggleEstadoTipoVehiculo(tipo.id_tipo_vehiculo, tipo.estado)
                          }
                        >
                          <IconPower size={16} stroke={1.5} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </div>
      )}
    </Stack>
  );
};
