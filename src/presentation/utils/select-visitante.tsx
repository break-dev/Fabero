import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActionIcon,
  Group,
  Loader,
  Select,
  Tooltip,
} from "@mantine/core";
import { IconUserPlus } from "@tabler/icons-react";
import { AuxService } from "../../service/auxiliar.service";
import { useNotify } from "../../hooks/useNotify";
import type { RES_Visitante } from "../../service/responses/auxiliar-visitas";
import { ModalRegistroVisitante } from "./modal-registro-visitante";

export interface VisitanteFormValue {
  id_visitante?: number;
  nombre: string;
  apellido: string;
  dni: string;
  telefono: string | null;
}

export interface SelectVisitanteProps {
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
  const [visitantes, setVisitantes] = useState<RES_Visitante[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const { notifyError } = useNotify();

  const cargar = useCallback(
    async (q: string) => {
      setLoading(true);
      try {
        const lista = await AuxService.get_visitantes(q.trim() || undefined);
        setVisitantes(lista);
      } catch (e) {
        console.error(e);
        notifyError("No se pudieron cargar los visitantes");
      } finally {
        setLoading(false);
      }
    },
    [notifyError],
  );

  useEffect(() => {
    cargar("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // `data` deriva de la lista completa para que el Select tenga
  // acceso a la label del visitante recién creado (sin re-fetch).
  const data = useMemo(() => {
    return visitantes.map((v) => {
      const nombreCompleto = [v.nombre, v.apellido].filter(Boolean).join(" ");
      const dniStr = v.dni ? ` (${v.dni})` : "";
      const telStr = showPhone && v.telefono ? ` · ${v.telefono}` : "";
      return {
        value: String(v.id_visitante),
        label: `${nombreCompleto}${dniStr}${telStr}`,
      };
    });
  }, [visitantes, showPhone]);

  const handleSearchChange = (q: string) => {
    setSearch(q);
    cargar(q);
  };

  const handleVisitanteCreado = (v: RES_Visitante) => {
    setModalCrearAbierto(false);
    // Prepend el visitante nuevo al state local para que el Select lo muestre
    // de inmediato, sin re-fetch ni esperar al próximo `cargar`.
    setVisitantes((prev) => [v, ...prev]);
    onChange({
      id_visitante: v.id_visitante,
      nombre: v.nombre,
      apellido: v.apellido ?? "",
      dni: v.dni ?? "",
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
            const v = visitantes.find((x) => x.id_visitante === id);
            if (v) {
              onChange({
                id_visitante: v.id_visitante,
                nombre: v.nombre,
                apellido: v.apellido ?? "",
                dni: v.dni ?? "",
                telefono: v.telefono ?? null,
              });
            }
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
