import React, { useState } from "react";
import { Group, Stack, Button, NumberInput, Text } from "@mantine/core";
import { IconSparkles, IconX } from "@tabler/icons-react";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";

interface ModalMejorCombinacionProps {
  opened: boolean;
  close: () => void;
  onAplicar: (
    leyMinOro: number,
    leyMinPlata: number,
    pesoMax: number,
    capMaxPorLotePct: number,
    precioOro?: number,
    precioPlata?: number,
  ) => void;
}

export const ModalMejorCombinacion: React.FC<ModalMejorCombinacionProps> = ({
  opened,
  close,
  onAplicar,
}) => {
  const [leyMinOro, setLeyMinOro] = useState<number | string>(0.12);
  const [leyMinPlata, setLeyMinPlata] = useState<number | string>(0.10);
  const [pesoMax, setPesoMax] = useState<number | string>(10000);
  const [capMaxPorLote, setCapMaxPorLote] = useState<number | string>(80);
  const [precioOro, setPrecioOro] = useState<number | string>("");
  const [precioPlata, setPrecioPlata] = useState<number | string>("");

  const fieldClasses = {
    input:
      "bg-zinc-900/50 border-zinc-800 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 text-white placeholder:text-zinc-500 transition-all",
    label: "text-zinc-300 mb-1 font-medium",
  };

  const handleAplicar = () => {
    const oro = typeof leyMinOro === "number" ? leyMinOro : parseFloat(leyMinOro) || 0;
    const plata = typeof leyMinPlata === "number" ? leyMinPlata : parseFloat(leyMinPlata) || 0;
    const maxP = typeof pesoMax === "number" ? pesoMax : parseFloat(pesoMax) || 0;
    const capPct = typeof capMaxPorLote === "number"
      ? capMaxPorLote
      : parseFloat(capMaxPorLote) || 80;
    const pOroRaw = typeof precioOro === "number" ? precioOro : parseFloat(precioOro);
    const pPlataRaw = typeof precioPlata === "number" ? precioPlata : parseFloat(precioPlata);
    const pOro = pOroRaw && pOroRaw > 0 ? pOroRaw : undefined;
    const pPlata = pPlataRaw && pPlataRaw > 0 ? pPlataRaw : undefined;

    onAplicar(oro, plata, maxP, capPct, pOro, pPlata);
    close();
  };

  return (
    <ModalEstandar
      opened={opened}
      close={close}
      title={
        <Group gap="xs">
          <IconSparkles size={18} className="text-amber-400" />
          <Text fw={700} fz="sm" c="white">
            Optimización de Mezcla (Mejor Combinación)
          </Text>
        </Group>
      }
      size="md"
    >
      <Stack gap="md" p="sm">
        
        <Group grow align="end" wrap="nowrap">
          <NumberInput
            label="Ley Mínima de Oro (Au)"
            placeholder="0.00"
            value={leyMinOro}
            onChange={setLeyMinOro}
            decimalScale={4}
            min={0}
            size="xs"
            radius="lg"
            classNames={fieldClasses}
          />

          <NumberInput
            label="Ley Mínima de Plata (Ag)"
            placeholder="0.00"
            value={leyMinPlata}
            onChange={setLeyMinPlata}
            decimalScale={4}
            min={0}
            size="xs"
            radius="lg"
            classNames={fieldClasses}
          />
        </Group>

        <NumberInput
          label="Peso Máximo Resultante (TMH kg)"
          placeholder="0.00"
          value={pesoMax}
          onChange={setPesoMax}
          decimalScale={2}
          min={0}
          size="xs"
          radius="lg"
          classNames={fieldClasses}
        />

        <NumberInput
          label="Cap Máximo por Lote (% del peso total)"
          description="Fuerza la mezcla: ningún lote podrá aportar más de este porcentaje"
          placeholder="80"
          value={capMaxPorLote}
          onChange={setCapMaxPorLote}
          suffix=" %"
          decimalScale={0}
          min={1}
          max={100}
          size="xs"
          radius="lg"
          classNames={fieldClasses}
        />

        <Text fz="xs" c="zinc.5" fw={700} className="uppercase tracking-wider mt-2">
          Rentabilidad (opcional)
        </Text>

        <Group grow align="end" wrap="nowrap">
          <NumberInput
            label="Precio Oro ($/oz)"
            description="Opcional: prioriza los lotes con mejor $/kg"
            placeholder="0.00"
            value={precioOro}
            onChange={setPrecioOro}
            decimalScale={2}
            min={0}
            size="xs"
            radius="lg"
            classNames={fieldClasses}
          />
          <NumberInput
            label="Precio Plata ($/oz)"
            description="Opcional: prioriza los lotes con mejor $/kg"
            placeholder="0.00"
            value={precioPlata}
            onChange={setPrecioPlata}
            decimalScale={2}
            min={0}
            size="xs"
            radius="lg"
            classNames={fieldClasses}
          />
        </Group>

        <Group justify="end" mt="md" gap="xs">
          <Button
            variant="default"
            size="xs"
            radius="lg"
            onClick={close}
            leftSection={<IconX size={14} />}
          >
            Cancelar
          </Button>
          <Button
            color="amber"
            size="xs"
            radius="lg"
            onClick={handleAplicar}
            leftSection={<IconSparkles size={14} />}
          >
            Calcular e Importar Lotes
          </Button>
        </Group>
      </Stack>
    </ModalEstandar>
  );
};
