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
    correlativoManual?: { correlativo: string; numeroCorrelativo: number },
  ) => void;
}

const CORRELATIVO_REGEX = /^\d{2}-[A-Z0-9]{1,5}-\d{5}$/;

export const ModalCondicionIngreso = ({
  opened,
  onClose,
  empresasTitulares,
  onConfirm,
}: ModalCondicionIngresoProps) => {
  const { notifyError } = useNotify();
  const [condicion, setCondicion] = useState<CondicionIngreso>(CondicionIngreso.Comercializacion);
  const [idEmpresa, setIdEmpresa] = useState<string | null>(null);
  const [esManual, setEsManual] = useState(false);
  const [correlativo, setCorrelativo] = useState("");

  useEffect(() => {
    if (opened) {
      setCondicion(CondicionIngreso.Comercializacion);
      setIdEmpresa(null);
      setEsManual(false);
      setCorrelativo("");
    }
  }, [opened]);

  const prefijoActual = useMemo(
    () => (condicion === CondicionIngreso.Comercializacion ? "FB" : "LOT"),
    [condicion],
  );

  const handleConfirm = () => {
    if (!idEmpresa) return;

    let manual: { correlativo: string; numeroCorrelativo: number } | undefined;
    if (esManual) {
      const corr = correlativo.trim().toUpperCase();
      if (!CORRELATIVO_REGEX.test(corr)) {
        notifyError("El correlativo debe tener formato YY-PREFIJO-NNNNN (ej. 26-LOT-00001)");
        return;
      }
      const num = Number(corr.split("-")[2]);
      if (!Number.isInteger(num) || num <= 0) {
        notifyError("El número correlativo debe ser un entero positivo");
        return;
      }
      manual = { correlativo: corr, numeroCorrelativo: num };
    }

    onConfirm(condicion, Number(idEmpresa), manual);
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

        <Checkbox
          label="Correlativo manual"
          checked={esManual}
          onChange={(e) => setEsManual(e.currentTarget.checked)}
          color="indigo"
          classNames={{ label: "text-zinc-200 text-sm" }}
        />

        {esManual && (
          <TextInput
            label="Correlativo"
            placeholder={`Ej. 26-${prefijoActual}-00001`}
            required
            withAsterisk
            value={correlativo}
            onChange={(e) => setCorrelativo(e.target.value.toUpperCase())}
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
