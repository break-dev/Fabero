import React, { useState, useEffect } from "react";
import { IconCheck, IconTrash, IconPlus, IconTrashX, IconHistory } from "@tabler/icons-react";
import { Loader, Badge, Select, Tooltip, Group } from "@mantine/core";
import { EstadoLeyes } from "../../../../shared/enums/_generic/estado-leyes";
import { TipoOrigen } from "../../../../shared/enums/_generic/tipo-origen";
import type { LoteCierreResponse, AnalisisMineralResponse } from "../../service/cierre-leyes.responses";
import type { GrupoAnalisisResponse, GrupoAnalisisDetalleResponse } from "../../../../modules/gestion-leyes/service/gestion-leyes.responses";
import type { GuardarValorPayload } from "../../service/cierre-leyes.service";
import type { CierreValidacion } from "../../hooks/useCierreLeyes";
import { useNotify } from "../../../../hooks/useNotify";
import type { RES_CambiosLog } from "../../../../service/responses/_generic/cambios-log";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { CambiosLogViewer } from "../../../../presentation/utils/cambios-log-viewer";

interface TablaCierreLeyesProps {
  lotes: LoteCierreResponse[];
  grupos: GrupoAnalisisResponse[];
  onGuardarValor: (payload: GuardarValorPayload) => Promise<boolean>;
  onAgregarAnalisis: (idLoteMineral: number) => Promise<boolean>;
  onEliminarFila: (idLoteMineral: number, uuidFila: string) => Promise<boolean>;
  onConfirmarLote: (idLoteMineral: number, conValorComercial: boolean) => Promise<boolean>;
  onActualizarOrigenFila: (idLoteMineral: number, uuidFila: string, tipoOrigen: TipoOrigen | null) => Promise<boolean>;
  confirmandoLote: Record<number, boolean>;
  agregandoAnalisisPorLote?: Record<number, boolean>;
  isGuardandoCelda?: (key: string) => boolean;
  cellKeyFn?: (p: Pick<GuardarValorPayload, "id_lote_mineral" | "id_grupo_analisis_detalle" | "uuid_fila" | "tipo_origen"> & { id?: number | null }) => string;
  validacionCierrePorLote?: Record<number, CierreValidacion>;
}

interface CellInputProps {
  initialValue: number;
  initialChecked: boolean;
  onSave: (val: number, checked: boolean) => void;
  onDelete?: () => void;
  disabled?: boolean;
  saving?: boolean;
  logCambios?: RES_CambiosLog[] | null;
  onViewLog?: () => void;
}

const CellInput = ({
  initialValue,
  initialChecked,
  onSave,
  onDelete,
  disabled,
  saving,
  logCambios,
  onViewLog,
}: CellInputProps) => {
  const { notifyWarning } = useNotify();
  const [val, setVal] = useState<string>(initialValue > 0 ? initialValue.toString() : "");
  const [checked, setChecked] = useState(initialChecked);

  const hasLog = Boolean(logCambios && logCambios.length > 0);

  useEffect(() => {
    setVal(initialValue > 0 ? initialValue.toString() : "");
  }, [initialValue]);

  useEffect(() => {
    setChecked(initialChecked);
  }, [initialChecked]);

  const handleBlur = () => {
    if (saving) return;
    const numericVal = parseFloat(val);
    if (!isNaN(numericVal)) {
      if (numericVal !== initialValue) {
        let newChecked = checked;
        if (numericVal <= 0 && checked) {
          newChecked = false;
          setChecked(false);
          notifyWarning("El análisis se desmarcó como confirmado porque el valor no es mayor a cero.");
        }
        onSave(numericVal, newChecked);
      }
    } else if (val === "") {
      if (initialValue !== 0) {
        let newChecked = checked;
        if (checked) {
          newChecked = false;
          setChecked(false);
          notifyWarning("El análisis se desmarcó como confirmado porque el valor está vacío.");
        }
        onSave(0, newChecked);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  const handleCheckboxToggle = () => {
    if (saving) return;
    const numericVal = parseFloat(val) || 0;
    if (!checked && numericVal <= 0) {
      notifyWarning("No se puede confirmar un análisis sin un valor mayor a cero.");
      return;
    }
    const newChecked = !checked;
    setChecked(newChecked);
    onSave(numericVal, newChecked);
  };

  return (
    <div className="flex items-center gap-0.5 min-w-22 justify-center py-0.5">
      <button
        type="button"
        disabled={disabled || saving}
        onClick={handleCheckboxToggle}
        className={`w-3.5 h-3.5 rounded-md border flex items-center justify-center transition-all ${checked
            ? "bg-emerald-600 border-emerald-500 text-white shadow-sm shadow-emerald-900/30"
            : "border-zinc-700 bg-zinc-900/50 text-transparent hover:border-zinc-500"
          }`}
      >
        <IconCheck size={9} stroke={3} />
      </button>
      <input
        type="number"
        step="any"
        disabled={disabled || saving}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder="0.00"
        className="w-12 h-5 text-center text-[10px] leading-none px-1 bg-zinc-950 border border-zinc-800 text-white rounded-md focus:border-zinc-400 focus:outline-none transition-all placeholder:text-zinc-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
      />
      {hasLog && (
        <Tooltip label="Ver historial de cambios" withArrow position="top">
          <button
            type="button"
            onClick={onViewLog}
            className="p-0.5 text-amber-400 hover:text-amber-300 rounded-md hover:bg-amber-500/10 transition-all flex items-center justify-center"
          >
            <IconHistory size={11} />
          </button>
        </Tooltip>
      )}
      {saving && <Loader size={7} color="indigo" />}
      {onDelete && !disabled && (
        <button
          type="button"
          onClick={onDelete}
          className="p-0.5 text-zinc-500 hover:text-red-400 rounded-md hover:bg-zinc-850 transition-all"
        >
          <IconTrash size={11} />
        </button>
      )}
    </div>
  );
};

export const TablaCierreLeyes = ({
  lotes,
  grupos,
  onGuardarValor,
  onAgregarAnalisis,
  onEliminarFila,
  onConfirmarLote,
  onActualizarOrigenFila,
  confirmandoLote,
  agregandoAnalisisPorLote,
  isGuardandoCelda,
  cellKeyFn,
  validacionCierrePorLote,
}: TablaCierreLeyesProps) => {
  const { notifyWarning } = useNotify();

  // Local state for history modal
  const [modalLogOpened, setModalLogOpened] = useState(false);
  const [selectedLogInfo, setSelectedLogInfo] = useState<{
    analitoNombre: string;
    cambios: RES_CambiosLog[] | null | undefined;
  } | null>(null);

  const handleOpenLogModal = (analitoNombre: string, cambios?: RES_CambiosLog[] | null) => {
    setSelectedLogInfo({ analitoNombre, cambios });
    setModalLogOpened(true);
  };

  // Local state to track selected TipoOrigen for each run (key: uuidFila, value: TipoOrigen | null)
  const [runOrigines, setRunOrigines] = useState<Record<string, TipoOrigen | null>>({});

  const handleUpdateOrigen = async (
    loteId: number,
    uuidFila: string,
    newOrigen: TipoOrigen | null,
  ) => {
    setRunOrigines((prev) => ({ ...prev, [uuidFila]: newOrigen }));
    await onActualizarOrigenFila(loteId, uuidFila, newOrigen);
  };

  const handleRemoveFilaLocal = async (loteId: number, uuidFila: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este análisis? Se borrarán todos los valores ingresados en él.")) {
      await onEliminarFila(loteId, uuidFila);
    }
  };

  // Helper function to calculate averages on the fly
  const getPromedioAnalito = (lote: LoteCierreResponse, detalleId: number): number => {
    const records = lote.analisis.filter(
      (a: AnalisisMineralResponse) =>
        a.id_grupo_analisis_detalle === detalleId &&
        a.esta_confirmada
    );
    if (records.length === 0) return 0;
    const sum = records.reduce((acc: number, curr: AnalisisMineralResponse) => acc + curr.ley, 0);
    return sum / records.length;
  };

  const buildCellKey = (
    p: Pick<GuardarValorPayload, "id_lote_mineral" | "id_grupo_analisis_detalle" | "uuid_fila" | "tipo_origen"> & { id?: number | null },
  ): string =>
    cellKeyFn
      ? cellKeyFn(p)
      : `${p.id_lote_mineral}|${p.id_grupo_analisis_detalle}|${p.uuid_fila}|${p.tipo_origen ?? "_"}|${p.id ?? "new"}`;

  return (
    <>
      <div className="w-full overflow-x-auto border border-zinc-800 rounded-2xl bg-zinc-900/20 backdrop-blur-md shadow-2xl">
        <table className="w-full text-left border-collapse table-auto">
          <thead>
            {/* First Header Row */}
            <tr className="bg-zinc-900/80 border-b border-zinc-800 text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
              <th colSpan={2} rowSpan={2} className="p-2.5 border-r border-zinc-800 text-center align-middle min-w-45">
                Lote
              </th>
              {grupos.map((g: GrupoAnalisisResponse) => {
                // Calculate colSpan dynamically
                let colSpan = 0;
                if (g.indicar_origen) {
                  // Tipo Origen + (Value + Promedio if es_desplegable, or Value if not)
                  colSpan = 1 + g.analitos.reduce((acc: number, a: GrupoAnalisisDetalleResponse) => acc + (a.es_desplegable ? 2 : 1), 0);
                } else {
                  colSpan = g.analitos.reduce((acc: number, a: GrupoAnalisisDetalleResponse) => acc + (a.es_desplegable ? 2 : 1), 0);
                }

                return (
                  <th
                    key={g.id}
                    colSpan={colSpan}
                    className="p-2 border-r border-zinc-800 text-center align-middle bg-zinc-900/50"
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-zinc-200 font-semibold">{g.nombre}</span>
                    </div>
                  </th>
                );
              })}
              <th colSpan={2} rowSpan={2} className="p-2.5 text-center align-middle min-w-44">
                Cierre
              </th>
            </tr>

            {/* Second Header Row */}
            <tr className="bg-zinc-900/60 border-b border-zinc-800 text-[10px] font-bold text-zinc-400 uppercase">
              {grupos.map((g: GrupoAnalisisResponse) => {
                const elements: React.ReactNode[] = [];
                if (g.indicar_origen) {
                  elements.push(
                    <th key={`${g.id}-origen`} className="p-1.5 border-r border-zinc-800 text-center align-middle font-medium text-zinc-500">
                      Tipo Origen
                    </th>
                  );
                  g.analitos.forEach((a: GrupoAnalisisDetalleResponse) => {
                    elements.push(
                      <th key={`${g.id}-${a.id_analito}`} className="p-1.5 border-r border-zinc-800 text-center align-middle bg-zinc-900/10">
                        <div className="flex flex-col items-center">
                          <span className="text-zinc-300 font-semibold">{a.nombre}</span>
                        </div>
                      </th>
                    );
                    if (a.es_desplegable) {
                      elements.push(
                        <th key={`${g.id}-${a.id_analito}-prom`} className="p-1.5 border-r border-zinc-800 text-center align-middle bg-zinc-900/20 font-semibold text-indigo-400">
                          Promedio
                        </th>
                      );
                    }
                  });
                } else {
                  g.analitos.forEach((a: GrupoAnalisisDetalleResponse) => {
                    elements.push(
                      <th key={`${g.id}-${a.id_analito}`} className="p-1.5 border-r border-zinc-800 text-center align-middle bg-zinc-900/10">
                        <div className="flex flex-col items-center">
                          <span className="text-zinc-300 font-semibold">{a.nombre}</span>
                        </div>
                      </th>
                    );
                    if (a.es_desplegable) {
                      elements.push(
                        <th key={`${g.id}-${a.id_analito}-prom`} className="p-1.5 border-r border-zinc-800 text-center align-middle bg-zinc-900/20 font-semibold text-indigo-400">
                          Promedio
                        </th>
                      );
                    }
                  });
                }
                return elements;
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {lotes.filter((l): l is LoteCierreResponse => l != null).map((l: LoteCierreResponse) => {
              // Get unique uuid_filas saved in database for this lote
              const dbUuids = Array.from(
                new Set(l.analisis.map((a: AnalisisMineralResponse) => a.uuid_fila).filter(Boolean))
              );
              const runs = dbUuids.length > 0 ? dbUuids : [`default-run-${l.id}`];
              const totalRowsForLote = runs.length;

              return runs.map((uuidFila: string, runIdx: number) => {
                const dbRecord = l.analisis.find((item: AnalisisMineralResponse) => item.uuid_fila === uuidFila && item.tipo_origen !== null);
                const currentTipoOrigen = (dbRecord?.tipo_origen ?? runOrigines[uuidFila] ?? null) as TipoOrigen | null;

                return (
                  <tr key={`${l.id}-${uuidFila}`} className="hover:bg-zinc-800/10 transition-colors border-b border-zinc-800">
                    {/* Lote Code & Date - render only on first row of run */}
                    {runIdx === 0 && (
                      <>
                        <td
                          rowSpan={totalRowsForLote}
                          className="p-2.5 border-r border-zinc-800 font-semibold text-xs text-zinc-100 align-middle text-center"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 rounded-full">
                              {l.correlativo}
                            </span>
                            {(() => {
                              const agregando = !!agregandoAnalisisPorLote?.[l.id];
                              const disabled = l.estado_leyes === EstadoLeyes.Confirmado || agregando;
                              return (
                                <button
                                  type="button"
                                  disabled={disabled}
                                  onClick={() => onAgregarAnalisis(l.id)}
                                  className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  {agregando ? <Loader size={10} color="currentColor" /> : <IconPlus size={10} />}
                                  {agregando ? "Agregando..." : "Agregar Análisis"}
                                </button>
                              );
                            })()}
                          </div>
                        </td>
                        <td
                          rowSpan={totalRowsForLote}
                          className="p-2.5 border-r border-zinc-800 text-[11px] text-zinc-400 align-middle text-center"
                        >
                          <div className="flex flex-col gap-1">
                            <div>
                              <span className="font-semibold text-zinc-500">Inicio:</span>{" "}
                              {l.fecha_hora_inicio_analisis
                                ? new Date(l.fecha_hora_inicio_analisis).toLocaleString("es-ES", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                                : "-"}
                            </div>
                            <div className="font-semibold text-zinc-300">
                              {l.empleado_inicio_nombre || "Desconocido"}
                            </div>
                          </div>
                        </td>
                      </>
                    )}

                    {/* Render groups */}
                    {grupos.map((g: GrupoAnalisisResponse) => {
                      if (g.indicar_origen) {
                        return (
                          <React.Fragment key={`${l.id}-${uuidFila}-${g.id}`}>
                            {/* Tipo Origen column */}
                            <td className="p-2 border-r border-zinc-800 text-[10px] font-semibold text-zinc-400 text-center bg-zinc-900/10 align-middle">
                              <div className="flex items-center justify-center gap-1.5">
                                <Select
                                  size="xs"
                                  data={[
                                    { value: "null", label: "—" },
                                    { value: TipoOrigen.Proveedor, label: "P" },
                                    { value: TipoOrigen.Interno, label: "I" },
                                  ]}
                                  value={currentTipoOrigen ?? "null"}
                                  onChange={(val) => {
                                    if (val === undefined) return;
                                    const next = val === "null" ? null : (val as TipoOrigen);
                                    handleUpdateOrigen(l.id, uuidFila, next);
                                  }}
                                  allowDeselect={false}
                                  disabled={l.estado_leyes === EstadoLeyes.Confirmado}
                                  style={{ width: 48 }}
                                  classNames={{
                                    input: "bg-zinc-950 border-zinc-800 text-white text-[11px] h-7 px-1 focus:border-zinc-500 text-center",
                                    option: "text-[11px]",
                                  }}
                                  comboboxProps={{ withinPortal: true }}
                                />
                                {runs.length > 1 && l.estado_leyes !== EstadoLeyes.Confirmado && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveFilaLocal(l.id, uuidFila)}
                                    className="text-zinc-500 hover:text-red-400 p-0.5 rounded transition-all"
                                    title="Eliminar este análisis"
                                  >
                                    <IconTrashX size={14} />
                                  </button>
                                )}
                              </div>
                            </td>

                            {/* Analitos in group */}
                            {g.analitos.map((a: GrupoAnalisisDetalleResponse) => {
                              const allRecordsOfDetalle = l.analisis.filter(
                                (item: AnalisisMineralResponse) => item.id_grupo_analisis_detalle === a.detalle_id
                              );

                              if (a.es_desplegable) {
                                const runRecords = allRecordsOfDetalle.filter(
                                  (item: AnalisisMineralResponse) =>
                                    item.uuid_fila === uuidFila &&
                                    item.tipo_origen === currentTipoOrigen
                                );
                                const mainRecord = runRecords[0];
                                const cellSaving = !!isGuardandoCelda?.(
                                  buildCellKey({
                                    id_lote_mineral: l.id,
                                    id_grupo_analisis_detalle: a.detalle_id,
                                    uuid_fila: uuidFila,
                                    tipo_origen: currentTipoOrigen,
                                    id: mainRecord?.id ?? null,
                                  }),
                                );

                                return (
                                  <React.Fragment key={`${l.id}-${uuidFila}-orig-frag-${a.detalle_id}`}>
                                    <td className="p-1.5 border-r border-zinc-800 text-center align-middle">
                                      <div className="flex flex-col gap-1 items-center">
                                        <CellInput
                                          key={mainRecord?.id || "new"}
                                          initialValue={mainRecord?.ley || 0}
                                          initialChecked={mainRecord ? mainRecord.esta_confirmada : false}
                                          disabled={l.estado_leyes === EstadoLeyes.Confirmado}
                                          saving={cellSaving}
                                          logCambios={mainRecord?.log_cambios}
                                          onViewLog={() => handleOpenLogModal(a.nombre, mainRecord?.log_cambios)}
                                          onSave={(val, checked) =>
                                            onGuardarValor({
                                              id: mainRecord?.id || null,
                                              id_lote_mineral: l.id,
                                              id_grupo_analisis_detalle: a.detalle_id,
                                              tipo_origen: currentTipoOrigen,
                                              uuid_fila: uuidFila,
                                              ley: val,
                                              esta_confirmada: checked,
                                            })
                                          }
                                        />
                                      </div>
                                    </td>
                                    {runIdx === 0 && (
                                      <td
                                        rowSpan={totalRowsForLote}
                                        className="p-1.5 border-r border-zinc-800 text-center font-bold text-[11px] text-indigo-400 bg-zinc-900/20 align-middle"
                                      >
                                        {getPromedioAnalito(l, a.detalle_id).toFixed(3)}
                                      </td>
                                    )}
                                  </React.Fragment>
                                );
                              } else {
                                // NOT desplegable: spans all rows vertically and renders only on runIdx === 0
                                if (runIdx !== 0) return null;

                                const cellSaving = !!isGuardandoCelda?.(
                                  buildCellKey({
                                    id_lote_mineral: l.id,
                                    id_grupo_analisis_detalle: a.detalle_id,
                                    uuid_fila: `default-run-${l.id}`,
                                    tipo_origen: null,
                                    id: allRecordsOfDetalle[0]?.id ?? null,
                                  }),
                                );

                                return (
                                  <td
                                    key={`${l.id}-orig-single-${a.detalle_id}`}
                                    rowSpan={totalRowsForLote}
                                    className="p-1.5 border-r border-zinc-800 text-center align-middle"
                                  >
                                    <div className="flex flex-col gap-1 items-center">
                                      <CellInput
                                        initialValue={allRecordsOfDetalle[0]?.ley || 0}
                                        initialChecked={allRecordsOfDetalle[0] ? allRecordsOfDetalle[0].esta_confirmada : false}
                                        disabled={l.estado_leyes === EstadoLeyes.Confirmado}
                                        saving={cellSaving}
                                        logCambios={allRecordsOfDetalle[0]?.log_cambios}
                                        onViewLog={() => handleOpenLogModal(a.nombre, allRecordsOfDetalle[0]?.log_cambios)}
                                        onSave={(val, checked) =>
                                          onGuardarValor({
                                            id: allRecordsOfDetalle[0]?.id || null,
                                            id_lote_mineral: l.id,
                                            id_grupo_analisis_detalle: a.detalle_id,
                                            tipo_origen: null,
                                            uuid_fila: `default-run-${l.id}`,
                                            ley: val,
                                            esta_confirmada: checked,
                                          })
                                        }
                                      />
                                    </div>
                                  </td>
                                );
                              }
                            })}
                          </React.Fragment>
                        );
                      } else {
                        return g.analitos.map((a: GrupoAnalisisDetalleResponse) => {
                          const allRecordsOfDetalle = l.analisis.filter(
                            (item: AnalisisMineralResponse) => item.id_grupo_analisis_detalle === a.detalle_id
                          );

                          if (a.es_desplegable) {
                            const runRecords = allRecordsOfDetalle.filter(
                              (item: AnalisisMineralResponse) =>
                                item.uuid_fila === uuidFila &&
                                item.tipo_origen === null
                            );
                            const mainRecord = runRecords[0];
                            const cellSaving = !!isGuardandoCelda?.(
                              buildCellKey({
                                id_lote_mineral: l.id,
                                id_grupo_analisis_detalle: a.detalle_id,
                                uuid_fila: uuidFila,
                                tipo_origen: null,
                                id: mainRecord?.id ?? null,
                              }),
                            );

                            return (
                              <React.Fragment key={`${l.id}-${uuidFila}-noorig-${a.detalle_id}`}>
                                <td className="p-1.5 border-r border-zinc-800 text-center align-middle">
                                  <div className="flex flex-col gap-1 items-center">
                                    <CellInput
                                      key={mainRecord?.id || "new"}
                                      initialValue={mainRecord?.ley || 0}
                                      initialChecked={mainRecord ? mainRecord.esta_confirmada : false}
                                      disabled={l.estado_leyes === EstadoLeyes.Confirmado}
                                      saving={cellSaving}
                                      logCambios={mainRecord?.log_cambios}
                                      onViewLog={() => handleOpenLogModal(a.nombre, mainRecord?.log_cambios)}
                                      onSave={(val, checked) =>
                                        onGuardarValor({
                                          id: mainRecord?.id || null,
                                          id_lote_mineral: l.id,
                                          id_grupo_analisis_detalle: a.detalle_id,
                                          tipo_origen: null,
                                          uuid_fila: uuidFila,
                                          ley: val,
                                          esta_confirmada: checked,
                                        })
                                      }
                                    />
                                  </div>
                                </td>
                                {runIdx === 0 && (
                                  <td
                                    rowSpan={totalRowsForLote}
                                    className="p-1.5 border-r border-zinc-800 text-center font-bold text-[11px] text-indigo-400 bg-zinc-900/20 align-middle"
                                  >
                                    {getPromedioAnalito(l, a.detalle_id).toFixed(3)}
                                  </td>
                                )}
                              </React.Fragment>
                            );
                          } else {
                            // NOT desplegable: spans all rows vertically and renders only on runIdx === 0
                            if (runIdx !== 0) return null;

                            const cellSaving = !!isGuardandoCelda?.(
                              buildCellKey({
                                id_lote_mineral: l.id,
                                id_grupo_analisis_detalle: a.detalle_id,
                                uuid_fila: `default-run-${l.id}`,
                                tipo_origen: null,
                                id: allRecordsOfDetalle[0]?.id ?? null,
                              }),
                            );

                            return (
                              <td
                                key={`${l.id}-noorig-single-${a.detalle_id}`}
                                rowSpan={totalRowsForLote}
                                className="p-1.5 border-r border-zinc-800 text-center align-middle"
                              >
                                <div className="flex flex-col gap-1 items-center">
                                  <CellInput
                                    initialValue={allRecordsOfDetalle[0]?.ley || 0}
                                    initialChecked={allRecordsOfDetalle[0] ? allRecordsOfDetalle[0].esta_confirmada : false}
                                    disabled={l.estado_leyes === EstadoLeyes.Confirmado}
                                    saving={cellSaving}
                                    logCambios={allRecordsOfDetalle[0]?.log_cambios}
                                    onViewLog={() => handleOpenLogModal(a.nombre, allRecordsOfDetalle[0]?.log_cambios)}
                                    onSave={(val, checked) =>
                                      onGuardarValor({
                                        id: allRecordsOfDetalle[0]?.id || null,
                                        id_lote_mineral: l.id,
                                        id_grupo_analisis_detalle: a.detalle_id,
                                        tipo_origen: null,
                                        uuid_fila: `default-run-${l.id}`,
                                        ley: val,
                                        esta_confirmada: checked,
                                      })
                                    }
                                  />
                                </div>
                              </td>
                            );
                          }
                        });
                      }
                    })}

                    {/* Render Cierre status & action */}
                    {runIdx === 0 && (
                      <>
                        <td
                          rowSpan={totalRowsForLote}
                          className="p-2.5 border-r border-zinc-800 text-xs text-center align-middle"
                        >
                          {l.estado_leyes === EstadoLeyes.Confirmado ? (
                            <Badge color="blue" radius="lg" size="xs" variant="light" className="font-semibold px-3 py-1">
                              Confirmado
                            </Badge>
                          ) : (
                            <Badge color="orange" radius="lg" size="xs" variant="light" className="font-semibold px-3 py-1">
                              En Proceso
                            </Badge>
                          )}
                        </td>
                        <td
                          rowSpan={totalRowsForLote}
                          className="p-2.5 text-xs text-center align-middle"
                        >
                          {l.estado_leyes === EstadoLeyes.Confirmado ? (
                            <div className="flex flex-col items-center gap-1">
                              <span className={`font-semibold text-[11px] px-2 py-0.5 rounded-lg ${l.con_valor_comercial
                                  ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                                  : "bg-red-500/10 border border-red-500/20 text-red-400"
                                }`}>
                                {l.con_valor_comercial ? "Con Valor Comercial" : "Sin Valor Comercial"}
                              </span>
                              <div className="text-[10px] text-zinc-500 mt-1">
                                <span className="font-semibold">Cerrado por:</span>{" "}
                                <span className="text-zinc-400 block">{l.empleado_confirmacion_nombre || "Desconocido"}</span>
                                <span className="block mt-0.5 text-[9px]">
                                  {l.fecha_hora_confirmacion_analisis
                                    ? new Date(l.fecha_hora_confirmacion_analisis).toLocaleString("es-ES")
                                    : ""}
                                </span>
                              </div>
                            </div>
                          ) : (() => {
                            const validacion = validacionCierrePorLote?.[l.id] ?? { ok: false, motivo: "Validación pendiente" };
                            const bloqueado = confirmandoLote[l.id] || !validacion.ok;
                            const tooltip = validacion.ok ? "Cerrar lote" : (validacion.motivo ?? "No se puede cerrar el lote");
                            const intentarCerrar = (conValor: boolean) => {
                              if (!validacion.ok) {
                                notifyWarning(validacion.motivo ?? "No se puede cerrar el lote");
                                return;
                              }
                              onConfirmarLote(l.id, conValor);
                            };
                            return (
                              <div className="flex flex-col gap-2 w-full max-w-40 mx-auto">
                                <button
                                  type="button"
                                  disabled={bloqueado}
                                  title={tooltip}
                                  onClick={() => intentarCerrar(true)}
                                  className="w-full py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-semibold shadow-md shadow-emerald-950/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  {confirmandoLote[l.id] ? <Loader size={12} color="white" /> : null}
                                  Con Valor Comercial
                                </button>
                                <button
                                  type="button"
                                  disabled={bloqueado}
                                  title={tooltip}
                                  onClick={() => intentarCerrar(false)}
                                  className="w-full py-1 px-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 rounded-xl text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  {confirmandoLote[l.id] ? <Loader size={12} color="white" /> : null}
                                  Sin Valor Comercial
                                </button>
                              </div>
                            );
                          })()}
                        </td>
                      </>
                    )}
                  </tr>
                );
              });
            })}
          </tbody>
        </table>
      </div>

      <ModalEstandar
        opened={modalLogOpened}
        close={() => setModalLogOpened(false)}
        title={
          <Group gap={6}>
            <IconHistory size={20} className="text-amber-400" />
            <span>Historial de cambios ({selectedLogInfo?.analitoNombre || "Análisis"})</span>
          </Group>
        }
        size="lg"
      >
        <CambiosLogViewer
          cambios={selectedLogInfo?.cambios}
          camposLegiblesCustom={{
            ley: "Ley",
            esta_confirmada: "Estado Confirmado",
            tipo_origen: "Tipo de origen",
          }}
        />
      </ModalEstandar>
    </>
  );
};
