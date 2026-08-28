import { useCallback, useEffect, useState } from "react";
import {
  ActionIcon,
  Button,
  Group,
  Loader,
  Select,
  Stack,
  TextInput,
  Tooltip,
} from "@mantine/core";
import {
  IconUserCheck,
  IconUserPlus,
} from "@tabler/icons-react";
import { ModalEstandar } from "../modal-estandar";
import { AuxService } from "../../../service/auxiliar.service";
import { useNotify } from "../../../hooks/useNotify";
import type { RES_Visitante } from "../../../service/responses/auxiliar-visitas";

export interface VisitanteFormValue {
  id_visitante?: number;
  nombre: string;
  apellido: string;
  dni: string;
  telefono: string | null;
}

interface SelectVisitanteProps {
  /** Valor seleccionado actualmente (id_visitante). */
  value?: number | null;
  /** Llamado cuando se selecciona un visitante existente o se crea uno nuevo. */
  onChange: (visitante: VisitanteFormValue) => void;
  /** Label opcional. */
  label?: string;
  /** Placeholder del input. */
  placeholder?: string;
  /** Mostrar el botón "+ Nuevo" al lado del select. Default true. */
  showCreateButton?: boolean;
  /** Mostrar teléfono como parte del label. */
  showPhone?: boolean;
  /** Ancho completo. */
  w?: number | string;
}

/**
 * Select reutilizable para seleccionar un Visitante existente.
 * - Permite buscar por nombre, apellido o DNI.
 * - Muestra un botón "+ Nuevo" al lado para crear un visitante en línea.
 * - Devuelve los datos completos del visitante seleccionado.
 */
export const SelectVisitante = ({
  value,
  onChange,
  label = "Visitante",
  placeholder = "Buscar por nombre o DNI...",
  showCreateButton = true,
  showPhone = false,
  w,
}: SelectVisitanteProps) => {
  const [search, setSearch] = useState("");
  const [data, setData] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const { notifyError } = useNotify();

  const cargar = useCallback(
    async (q: string) => {
      setLoading(true);
      try {
        const lista = await AuxService.get_visitantes(q.trim() || undefined);
        setData(
          lista.map((v) => ({
            value: String(v.id_visitante),
            label: showPhone
              ? `${v.nombre} ${v.apellido ?? ""} (${v.dni})${v.telefono ? ` · ${v.telefono}` : ""}`
              : `${v.nombre} ${v.apellido ?? ""} (${v.dni})`,
          })),
        );
      } catch (e) {
        console.error(e);
        notifyError("No se pudieron cargar los visitantes");
      } finally {
        setLoading(false);
      }
    },
    [notifyError, showPhone],
  );

  useEffect(() => {
    cargar("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchChange = (q: string) => {
    setSearch(q);
    cargar(q);
  };

  const handleVisitanteCreado = (v: RES_Visitante) => {
    setModalCrearAbierto(false);
    onChange({
      id_visitante: v.id_visitante,
      nombre: v.nombre,
      apellido: v.apellido,
      dni: v.dni,
      telefono: v.telefono ?? null,
    });
  };

  return (
    <>
      <Group gap="xs" align="flex-end" wrap="nowrap">
        <Select
          label={label}
          placeholder={placeholder}
          data={data}
          value={value != null ? String(value) : null}
          searchable
          searchValue={search}
          onSearchChange={handleSearchChange}
          nothingFoundMessage={loading ? "Buscando..." : "Sin resultados"}
          rightSection={loading ? <Loader size="xs" /> : undefined}
          onChange={(val) => {
            if (val === null) {
              onChange({
                id_visitante: undefined,
                nombre: "",
                apellido: "",
                dni: "",
                telefono: null,
              });
              return;
            }
            const id = Number(val);
            AuxService.get_visitantes().then((lista) => {
              const v = lista.find((x) => x.id_visitante === id);
              if (v) {
                onChange({
                  id_visitante: v.id_visitante,
                  nombre: v.nombre,
                  apellido: v.apellido,
                  dni: v.dni,
                  telefono: v.telefono ?? null,
                });
              }
            });
          }}
          w={w}
          classNames={{
            input: "bg-zinc-900/50 border-zinc-800",
            label: "text-zinc-300 mb-1 font-medium text-xs",
          }}
          style={{ flex: 1 }}
        />
        {showCreateButton && (
          <Tooltip label="Crear nuevo visitante" withArrow>
            <ActionIcon
              type="button"
              variant="filled"
              color="indigo"
              size="lg"
              radius="md"
              onClick={() => setModalCrearAbierto(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white mb-0.5"
              aria-label="Crear nuevo visitante"
            >
              <IconUserPlus size={16} />
            </ActionIcon>
          </Tooltip>
        )}
      </Group>

      <ModalRegistroVisitante
        opened={modalCrearAbierto}
        onClose={() => setModalCrearAbierto(false)}
        onCreated={handleVisitanteCreado}
      />
    </>
  );
};

interface ModalRegistroVisitanteProps {
  opened: boolean;
  onClose: () => void;
  onCreated: (visitante: RES_Visitante) => void;
}

/**
 * Modal para crear un nuevo visitante (nombre, apellido, dni, telefono).
 * Llama a AuxService.crear_visitante y devuelve el visitante creado vía onCreated.
 */
export const ModalRegistroVisitante = ({
  opened,
  onClose,
  onCreated,
}: ModalRegistroVisitanteProps) => {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [dni, setDni] = useState("");
  const [telefono, setTelefono] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    nombre?: string;
    apellido?: string;
    dni?: string;
  }>({});
  const { notifySuccess, notifyError } = useNotify();

  useEffect(() => {
    if (!opened) {
      setNombre("");
      setApellido("");
      setDni("");
      setTelefono("");
      setErrors({});
    }
  }, [opened]);

  const handleGuardar = async () => {
    const newErrors: typeof errors = {};
    if (!nombre.trim()) newErrors.nombre = "Requerido";
    if (!apellido.trim()) newErrors.apellido = "Requerido";
    if (!dni.trim() || !/^\d{6,8}$/.test(dni.trim())) {
      newErrors.dni = "DNI debe tener 6-8 dígitos";
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      const resp = await AuxService.crear_visitante({
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        dni: dni.trim(),
        telefono: telefono.trim() || null,
      });
      if (resp.success && resp.data) {
        notifySuccess("Visitante registrado correctamente");
        onCreated(resp.data);
      } else {
        notifyError(resp.message || "No se pudo crear el visitante");
      }
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Error al crear el visitante";
      notifyError(message);
    } finally {
      setLoading(false);
    }
  };

  const fieldClasses = {
    input:
      "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all",
    label: "text-zinc-300 mb-1 font-medium text-xs",
  };

  return (
    <ModalEstandar
      opened={opened}
      close={onClose}
      title="Crear Nuevo Visitante"
      size="md"
    >
      <Stack gap="md">
        <Group grow wrap="nowrap">
          <TextInput
            label="Nombre"
            placeholder="Nombre"
            value={nombre}
            onChange={(e) => {
              setNombre(e.currentTarget.value);
              if (errors.nombre) setErrors((p) => ({ ...p, nombre: undefined }));
            }}
            error={errors.nombre}
            radius="xl"
            classNames={fieldClasses}
            required
          />
          <TextInput
            label="Apellido"
            placeholder="Apellido"
            value={apellido}
            onChange={(e) => {
              setApellido(e.currentTarget.value);
              if (errors.apellido)
                setErrors((p) => ({ ...p, apellido: undefined }));
            }}
            error={errors.apellido}
            radius="xl"
            classNames={fieldClasses}
            required
          />
        </Group>

        <Group grow wrap="nowrap">
          <TextInput
            label="DNI / Documento"
            placeholder="12345678"
            value={dni}
            maxLength={8}
            onChange={(e) => {
              const v = e.currentTarget.value.replace(/\D/g, "").slice(0, 8);
              setDni(v);
              if (errors.dni) setErrors((p) => ({ ...p, dni: undefined }));
            }}
            error={errors.dni}
            radius="xl"
            classNames={fieldClasses}
            required
          />
          <TextInput
            label="Teléfono"
            placeholder="987654321"
            value={telefono}
            onChange={(e) => setTelefono(e.currentTarget.value)}
            radius="xl"
            classNames={fieldClasses}
          />
        </Group>

        <Group justify="flex-end" gap="sm">
          <Button
            variant="subtle"
            onClick={onClose}
            radius="xl"
            size="xs"
            className="text-zinc-400 hover:text-white"
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            radius="xl"
            size="xs"
            leftSection={<IconUserCheck size={14} />}
            onClick={handleGuardar}
            loading={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Crear Visitante
          </Button>
        </Group>
      </Stack>
    </ModalEstandar>
  );
};
