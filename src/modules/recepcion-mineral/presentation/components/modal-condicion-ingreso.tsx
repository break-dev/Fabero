import { useState } from "react";
import { Select, Button } from "@mantine/core";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { CondicionIngreso } from "../../../../shared/enums/_generic/condicion-ingreso";
import type { RES_Empresa } from "../../../../service/responses/empresa";

interface ModalCondicionIngresoProps {
  opened: boolean;
  onClose: () => void;
  empresasTitulares: RES_Empresa[];
  onConfirm: (condicion: CondicionIngreso, idEmpresa: number) => void;
}

export const ModalCondicionIngreso = ({
  opened,
  onClose,
  empresasTitulares,
  onConfirm,
}: ModalCondicionIngresoProps) => {
  const [condicion, setCondicion] = useState<CondicionIngreso>(CondicionIngreso.Comercializacion);
  const [idEmpresa, setIdEmpresa] = useState<string | null>(null);

  const selectedEmpresa = empresasTitulares.find((e) => String(e.id_empresa) === idEmpresa);
  const prefijoActual = selectedEmpresa?.prefijo ? selectedEmpresa.prefijo : "FB";

  const handleConfirm = () => {
    if (!idEmpresa) return;
    onConfirm(condicion, Number(idEmpresa));
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
      <div className="flex flex-col gap-4 p-2">
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
              label: `Comercialización (Prefijo ${prefijoActual})`,
            },
            { value: CondicionIngreso.Chancado, label: "Chancado (Prefijo LOT)" },
            { value: CondicionIngreso.Almacen, label: "Almacén (Prefijo LOT)" },
          ]}
          value={condicion}
          onChange={(val) => setCondicion((val as CondicionIngreso) || CondicionIngreso.Comercializacion)}
          allowDeselect={false}
          classNames={fieldClasses}
          comboboxProps={{ withinPortal: true }}
          radius="md"
        />

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
      </div>
    </ModalEstandar>
  );
};
