import { useState, useMemo, useEffect } from "react";
import { Select, Button, Checkbox, TextInput, Stack } from "@mantine/core";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { CondicionIngreso } from "../../../../shared/enums/_generic/condicion-ingreso";
import { useNotify } from "../../../../hooks/useNotify";
import type { RES_Empresa } from "../../../../service/responses/empresa";

interface ModalCondicionIngresoProps {
  opened: boolean;
  onClose: () => void;
  empresasTitulares: RES_Empresa[];
  onConfirm: (
    condicion: CondicionIngreso,
    idEmpresa: number,
    codigoManual?: { conCodigoManual: boolean; codigoManual?: string },
  ) => void;
}

export const ModalCondicionIngreso = ({
  opened,
  onClose,
  empresasTitulares,
  onConfirm,
}: ModalCondicionIngresoProps) => {
  const { notifyError } = useNotify();
  const [condicion, setCondicion] = useState<CondicionIngreso>(CondicionIngreso.Comercializacion);
  const [idEmpresa, setIdEmpresa] = useState<string | null>(null);
  const [conCodigoManual, setConCodigoManual] = useState(false);
  const [codigoManual, setCodigoManual] = useState("");

  // Identifica la empresa Fabero por coincidencia en razon_social.
  // Heurística estable: primera empresa cuya razón social contiene "fabero"
  // (case-insensitive). Si no hay coincidencia, queda sin selección.
  const faberoEmpresa = useMemo(
    () =>
      empresasTitulares.find((e) =>
        e.razon_social?.toLowerCase().includes("fabero"),
      ),
    [empresasTitulares],
  );

  useEffect(() => {
    if (opened) {
      setCondicion(CondicionIngreso.Comercializacion);
      setIdEmpresa(faberoEmpresa ? String(faberoEmpresa.id_empresa) : null);
      setConCodigoManual(false);
      setCodigoManual("");
    }
  }, [opened, faberoEmpresa]);

  const handleConfirm = () => {
    if (!idEmpresa) return;

    if (conCodigoManual && !codigoManual.trim()) {
      notifyError("Debe ingresar el código manual");
      return;
    }

    const payload: { conCodigoManual: boolean; codigoManual?: string } = {
      conCodigoManual,
    };
    if (conCodigoManual) {
      payload.codigoManual = codigoManual.trim().toUpperCase();
    }

    onConfirm(condicion, Number(idEmpresa), payload);
  };

  const fieldClasses = {
    input: "bg-zinc-900/50 border-zinc-800 text-white focus:border-indigo-500",
    label: "text-zinc-300 mb-1 font-medium text-xs",
  };

  return (
    <ModalEstandar
      opened={opened}
      close={onClose}
      title="Nuevo Lote"
      size="md"
    >
      <Stack gap="md" className="p-2">
        <Select
          label="Empresa Titular"
          placeholder="Seleccionar empresa"
          required
          withAsterisk
          data={empresasTitulares.map((e) => ({
            value: String(e.id_empresa),
            label: e.razon_social
          }))}
          value={idEmpresa}
          onChange={(val) => setIdEmpresa(val)}
          classNames={fieldClasses}
          comboboxProps={{ withinPortal: true }}
          radius="md"
        />

        <Select
          label="Condición de Ingreso"
          placeholder="Seleccionar condición"
          required
          withAsterisk
          data={[
            {
              value: CondicionIngreso.Comercializacion,
              label: "Comercialización",
            },
            {
              value: CondicionIngreso.OtrosServicios,
              label: "Otros Servicios",
            },
          ]}
          value={condicion}
          onChange={(val) => setCondicion((val as CondicionIngreso) || CondicionIngreso.Comercializacion)}
          allowDeselect={false}
          classNames={fieldClasses}
          comboboxProps={{ withinPortal: true }}
          radius="md"
        />

        <Checkbox
          label="Código manual"
          checked={conCodigoManual}
          onChange={(e) => setConCodigoManual(e.currentTarget.checked)}
          color="indigo"
          classNames={{ label: "text-zinc-200 text-sm" }}
        />

        {conCodigoManual && (
          <TextInput
            label="Código"
            placeholder="Ingrese el código del lote"
            required
            withAsterisk
            value={codigoManual}
            onChange={(e) => setCodigoManual(e.target.value.toUpperCase())}
            classNames={fieldClasses}
            radius="md"
          />
        )}

        <div className="flex justify-end gap-2 mt-2">
          <Button variant="subtle" color="zinc" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            color="indigo"
            disabled={!idEmpresa}
            onClick={handleConfirm}
          >
            Generar Lote
          </Button>
        </div>
      </Stack>
    </ModalEstandar>
  );
};
