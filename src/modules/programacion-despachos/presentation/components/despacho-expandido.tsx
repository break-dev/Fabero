import { useEffect } from "react";
import { Stack, Text, Group } from "@mantine/core";
import { IconPackage, IconTruck } from "@tabler/icons-react";
import type {
  DistribucionItem as DistribucionItemFull,
} from "../../service/programacion-despachos.responses";
import { useDespachoDetalle } from "../../hooks/useDespachoDetalle";
import { DistribucionExpandida } from "./distribucion-expandida";

interface Props {
  idDespacho: number;
  onVerLog: (dist: DistribucionItemFull) => void;
}

export const DespachoExpandido = ({
  idDespacho,
  onVerLog,
}: Props) => {
  const { detalle, loading, refrescar } = useDespachoDetalle(idDespacho);

  useEffect(() => {
    refrescar();
  }, [idDespacho, refrescar]);

  if (loading && !detalle) {
    return (
      <div className="p-6 text-center text-zinc-500 text-sm">Cargando detalle...</div>
    );
  }

  if (!detalle) {
    return (
      <div className="p-6 text-center text-zinc-500 text-sm">No se pudo cargar el detalle.</div>
    );
  }

  const distribuciones = detalle.distribuciones;

  return (
    <Stack gap="md" p="md">
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-4 items-start">
        <div>
          <Group gap={6} mb={6}>
            <IconPackage size={14} className="text-zinc-400" />
            <Text size="xs" fw={700} className="text-zinc-300">
              Detalle del despacho ({detalle.detalles.length})
            </Text>
          </Group>
          <div className="rounded-xl border border-zinc-800/70 overflow-hidden">
            {detalle.detalles.length === 0 ? (
              <div className="px-3 py-4 text-center text-zinc-500 text-xs">
                Este despacho no tiene items.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] border-collapse">
                  <thead>
                    <tr className="text-[9px] uppercase tracking-wider text-zinc-500 bg-zinc-900/60 font-bold border-b border-zinc-800/70">
                      <th className="py-2 px-3 text-center font-bold">Correlativo / Proveedor</th>
                      <th className="py-2 px-3 text-center font-bold">Peso Tomado (KG)</th>
                      <th className="py-2 px-3 text-center font-bold">Peso Pendiente (KG)</th>
                      <th className="py-2 px-3 text-center font-bold">% Distribuido</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {detalle.detalles.map((d) => {
                      const total = d.peso_tomado ?? 0;
                      const pend = d.peso_actual ?? 0;
                      const dist = total - pend;
                      const pct = total > 0 ? (dist / total) * 100 : 0;
                      return (
                        <tr
                          key={d.id}
                          className="hover:bg-zinc-900/30 transition-colors"
                        >
                          <td className="py-2 px-3 text-center align-middle">
                            <Text size="11px" className="text-zinc-300">
                              <span className="font-mono font-medium">
                                {d.lote_correlativo ?? d.blending_correlativo}
                              </span>
                              {d.proveedor_razon_social ? (
                                <span className="text-zinc-500 ml-1">
                                  · {d.proveedor_razon_social}
                                </span>
                              ) : null}
                            </Text>
                          </td>
                          <td className="py-2 px-3 text-center align-middle">
                            <Text size="11px" className="text-zinc-200 font-mono">
                              {(d.peso_tomado ?? 0).toFixed(3)}
                            </Text>
                          </td>
                          <td className="py-2 px-3 text-center align-middle">
                            <Text
                              size="11px"
                              className={`font-mono ${pend > 0 ? "text-amber-400" : "text-emerald-400"}`}
                            >
                              {pend.toFixed(3)}
                            </Text>
                          </td>
                          <td className="py-2 px-3 text-center align-middle">
                            <Text
                              size="11px"
                              className={`font-mono ${pct >= 99.99 ? "text-emerald-400" : "text-zinc-300"}`}
                            >
                              {pct.toFixed(1)}%
                            </Text>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div>
          <Group gap={6} mb={6}>
            <IconTruck size={14} className="text-zinc-400" />
            <Text size="xs" fw={700} className="text-zinc-300">
              Distribuciones ({distribuciones.length})
            </Text>
          </Group>
          {distribuciones.length === 0 ? (
            <div className="px-3 py-4 text-center text-zinc-500 text-xs border border-dashed border-zinc-800 rounded-lg">
              Aún no se han registrado distribuciones.
            </div>
          ) : (
            <Stack gap="xs">
              {distribuciones.map((d) => (
                <DistribucionExpandida
                  key={d.id}
                  distribucion={d}
                  onVerLog={onVerLog}
                />
              ))}
            </Stack>
          )}
        </div>
      </div>
    </Stack>
  );
};