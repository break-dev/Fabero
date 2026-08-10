import { useState } from "react";
import { Text, Button, Textarea, Badge } from "@mantine/core";
import { DataTableEstandar } from "../../../../presentation/utils/datatable-estandar";
import { IconPaperclip, IconCar } from "@tabler/icons-react";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { ArchivoCard } from "../../../../presentation/utils/archivo/archivo-card";
import { MultiFilePicker } from "../../../../presentation/utils/archivo/multifile-picker";
import type { RecepcionVisitaResponse } from "../../service/recepcion-visitas.responses";
import type { IArchivo } from "../../../../shared/interfaces/archivo";
import { RecepcionVisitasService } from "../../service/recepcion-visitas.service";
import { useNotify } from "../../../../hooks/useNotify";

interface Props {
  recepciones: RecepcionVisitaResponse[];
  loading: boolean;
  onUpdateRecepcion: (r: RecepcionVisitaResponse) => void;
}

export const TablaVisitas = ({ recepciones, loading, onUpdateRecepcion }: Props) => {
  const [selectedEvidencias, setSelectedEvidencias] = useState<IArchivo[] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewAllEvidenciasRecord, setViewAllEvidenciasRecord] = useState<RecepcionVisitaResponse | null>(null);

  // Salida Individual
  const [exitRecord, setExitRecord] = useState<{ idDetalle: number; visitanteNombre: string } | null>(null);
  const [observacionSalida, setObservacionSalida] = useState("");
  const [evidenciasSalida, setEvidenciasSalida] = useState<File[]>([]);
  const [savingExit, setSavingExit] = useState(false);

  // Salida General
  const [exitGeneralRecord, setExitGeneralRecord] = useState<{ id: number; motivo: string } | null>(null);
  const [observacionSalidaGeneral, setObservacionSalidaGeneral] = useState("");
  const [evidenciasSalidaGeneral, setEvidenciasSalidaGeneral] = useState<File[]>([]);
  const [savingExitGeneral, setSavingExitGeneral] = useState(false);

  const { notifySuccess, notifyError } = useNotify();

  const handleOpenEvidencias = (evidencias: IArchivo[]) => {
    setSelectedEvidencias(evidencias);
    setModalOpen(true);
  };

  const formatFecha = (fechaStr: string) => {
    try {
      const date = new Date(fechaStr.replace(" ", "T"));
      if (isNaN(date.getTime())) return fechaStr;

      const pad = (num: number) => num.toString().padStart(2, "0");

      const yyyy = date.getFullYear();
      const mm = pad(date.getMonth() + 1);
      const dd = pad(date.getDate());
      const hh = pad(date.getHours());
      const min = pad(date.getMinutes());
      const ss = pad(date.getSeconds());

      return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
    } catch {
      return fechaStr;
    }
  };

  interface GrupoVehiculo {
    placa: string | null;
    visitantes: RecepcionVisitaResponse["visitantes"];
  }

  const getGruposVehiculo = (r: RecepcionVisitaResponse): GrupoVehiculo[] => {
    if (!r.visitantes || r.visitantes.length === 0) return [];

    const mapGrupos = new Map<string, GrupoVehiculo>();

    r.visitantes.forEach((v) => {
      const placa = v.vehiculo_placa || (v.es_conductor && r.placa ? r.placa : null);
      const key = placa ? placa.toUpperCase().trim() : "__NO_VEHICULO__";

      if (!mapGrupos.has(key)) {
        mapGrupos.set(key, {
          placa: placa ? placa.toUpperCase().trim() : null,
          visitantes: [],
        });
      }
      mapGrupos.get(key)!.visitantes.push(v);
    });

    return Array.from(mapGrupos.values());
  };

  const getVehiclePhotos = (r: RecepcionVisitaResponse, placa: string | null): IArchivo[] => {
    if (!placa || !r.vehiculos || r.vehiculos.length === 0) return [];

    const targetPlaca = placa.trim().toUpperCase();
    const veh = r.vehiculos.find((v) => v.placa && v.placa.trim().toUpperCase() === targetPlaca);
    if (!veh || !veh.url_foto) return [];

    const parseList = (raw: string[] | string | null | undefined): string[] => {
      if (!raw) return [];
      if (Array.isArray(raw)) return raw;
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return typeof raw === "string" ? [raw] : [];
      }
    };

    const urls = parseList(veh.url_foto);
    return urls.map((url) => {
      const nombre_original = url.split("/").pop() || "Foto Vehículo";
      const extension = nombre_original.split(".").pop() || null;
      return { url, path_relativo: "", nombre_original, extension };
    });
  };

  const getEvidenciasRecepcionGrouped = (r: RecepcionVisitaResponse) => {
    const parseList = (raw: string[] | string | null | undefined): string[] => {
      if (!raw) return [];
      if (Array.isArray(raw)) return raw;
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    };

    const toIArchivo = (url: string, defaultName: string): IArchivo => {
      const nombre_original = url.split("/").pop() || defaultName;
      const extension = nombre_original.split(".").pop() || null;
      return { url, path_relativo: "", nombre_original, extension };
    };

    const ingresoUrls = parseList(r.evidencias_ingreso);
    const salidaUrls = parseList(r.evidencias_salida);

    return {
      ingreso: Array.from(new Set(ingresoUrls)).map((u) => toIArchivo(u, "Evidencia Ingreso")),
      salida: Array.from(new Set(salidaUrls)).map((u) => toIArchivo(u, "Evidencia Salida")),
    };
  };

  const handleSaveExit = async () => {
    if (!exitRecord) return;

    setSavingExit(true);
    try {
      const updated = await RecepcionVisitasService.registrarSalida(exitRecord.idDetalle, {
        observacion_salida: observacionSalida,
        evidencias: evidenciasSalida,
      });
      notifySuccess("Salida de visitante registrada correctamente");
      onUpdateRecepcion(updated);
      setExitRecord(null);
      setObservacionSalida("");
      setEvidenciasSalida([]);
    } catch (err: unknown) {
      console.error(err);
      notifyError("Ocurrió un error al registrar la salida");
    } finally {
      setSavingExit(false);
    }
  };

  const handleSaveExitGeneral = async () => {
    if (!exitGeneralRecord) return;

    setSavingExitGeneral(true);
    try {
      const updated = await RecepcionVisitasService.registrarSalidaGeneral(exitGeneralRecord.id, {
        observacion_salida: observacionSalidaGeneral,
        evidencias_salida: evidenciasSalidaGeneral,
      });
      notifySuccess("Salida general de recepción registrada correctamente");
      onUpdateRecepcion(updated);
      setExitGeneralRecord(null);
      setObservacionSalidaGeneral("");
      setEvidenciasSalidaGeneral([]);
    } catch (err: unknown) {
      console.error(err);
      const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
      const msg = axiosError.response?.data?.message || axiosError.message || "Error al registrar salida general";
      notifyError(msg);
    } finally {
      setSavingExitGeneral(false);
    }
  };

  return (
    <>
      <DataTableEstandar
        idAccessor="id"
        records={recepciones.filter(Boolean)}
        loading={loading}
        columns={[
          {
            accessor: "index",
            title: "#",
            textAlign: "center",
            width: 50,
            render: (_: RecepcionVisitaResponse, index: number) => index + 1,
          },
          {
            accessor: "fecha_hora_ingreso",
            title: "Ingreso / Registrado Por",
            width: 150,
            textAlign: "center",
            render: (r: RecepcionVisitaResponse) => {
              const tieneVisitantesEnPlanta = r.visitantes?.some((v) => v.estado === "En Planta" || !v.estado);
              const headerEnPlanta = r.estado === "En Planta" || (!r.estado && tieneVisitantesEnPlanta);

              return (
                <div className="flex flex-col items-center justify-center text-center gap-1 w-full">
                  <Text size="xs" className="text-zinc-200 font-mono" fw={700}>
                    {formatFecha(r.fecha_hora_ingreso)}
                  </Text>
                  <Text size="10px" className="text-zinc-500">
                    {r.empleado_registro_nombre || "Sistema"}
                  </Text>
                  {headerEnPlanta && (
                    <Button
                      size="xs"
                      color="red"
                      variant="filled"
                      radius="md"
                      onClick={() => {
                        setExitGeneralRecord({ id: r.id, motivo: r.motivo_ingreso_nombre });
                        setObservacionSalidaGeneral("");
                        setEvidenciasSalidaGeneral([]);
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold h-5.5 px-2 text-[10px] shadow-sm mt-1"
                    >
                      Salida General
                    </Button>
                  )}
                </div>
              );
            },
          },
          {
            accessor: "empleado_contacto_nombre",
            title: "Personal Contacto",
            width: 130,
            textAlign: "center",
            render: (r: RecepcionVisitaResponse) => {
              const nombreContacto =
                r.empleado_contacto_nombre ||
                r.empleado_autoriza_nombre ||
                r.empleado_registro_nombre ||
                "—";
              return (
                <Text size="xs" className="text-zinc-200 text-center w-full font-medium" truncate title={nombreContacto}>
                  {nombreContacto}
                </Text>
              );
            },
          },
          {
            accessor: "motivo_ingreso_nombre",
            title: "Motivo Visita",
            width: 120,
            textAlign: "center",
            render: (r: RecepcionVisitaResponse) => {
              const groupedEv = getEvidenciasRecepcionGrouped(r);
              const totalEv = groupedEv.ingreso.length + groupedEv.salida.length;

              return (
                <div className="flex flex-col items-center gap-1 w-full justify-center">
                  <span className="inline-flex items-center justify-center bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-0.5 rounded-md font-bold text-xs">
                    {r.motivo_ingreso_nombre}
                  </span>
                  {totalEv > 0 && (
                    <Button
                      size="xs"
                      variant="light"
                      color="indigo"
                      radius="xl"
                      leftSection={<IconPaperclip size={11} />}
                      onClick={() => setViewAllEvidenciasRecord(r)}
                      className="bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/10 h-4.5 px-1.5 text-[9px] font-bold mt-0.5"
                    >
                      Evidencias ({totalEv})
                    </Button>
                  )}
                </div>
              );
            },
          },
          {
            accessor: "observacion",
            title: "Observación",
            width: 140,
            textAlign: "center",
            render: (r: RecepcionVisitaResponse) => (
              <Text size="xs" className="text-zinc-400 italic max-w-32.5 mx-auto text-center" truncate title={r.observacion || ""}>
                {r.observacion || "—"}
              </Text>
            ),
          },
          {
            accessor: "vehiculo",
            title: "Vehículo",
            width: 140,
            textAlign: "center",
            render: (r: RecepcionVisitaResponse) => {
              const grupos = getGruposVehiculo(r);
              if (grupos.length === 0) {
                const tienePlacaHeader = Boolean(r.placa);
                const tieneVehiculos = Boolean(r.vehiculos && r.vehiculos.length > 0);

                if (!r.con_vehiculo && !tienePlacaHeader && !tieneVehiculos) {
                  return <Text size="xs" className="text-zinc-500 italic text-center w-full">No</Text>;
                }

                return (
                  <div className="flex flex-col items-center justify-center gap-1.5 w-full">
                    {r.vehiculos?.map((veh, vIdx) => {
                      const photos = getVehiclePhotos(r, veh.placa);
                      return (
                        <div key={vIdx} className="flex flex-col items-center gap-1 text-zinc-300">
                          <div className="flex items-center gap-1.5">
                            <IconCar size={14} className="text-blue-400" />
                            <span className="font-mono text-xs font-bold bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-md uppercase">
                              {veh.placa}
                            </span>
                          </div>
                          {photos.length > 0 && (
                            <Button
                              size="xs"
                              variant="light"
                              color="indigo"
                              radius="xl"
                              leftSection={<IconPaperclip size={11} />}
                              onClick={() => handleOpenEvidencias(photos)}
                              className="bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/10 h-4.5 px-1.5 text-[9px] font-bold mt-0.5"
                            >
                              Fotos ({photos.length})
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              }

              return (
                <div className="flex flex-col gap-1.5 w-full">
                  {grupos.map((g, gIdx) => {
                    const photos = getVehiclePhotos(r, g.placa);
                    return (
                      <div
                        key={gIdx}
                        className="flex flex-col items-center justify-center p-2 bg-zinc-900/30 border border-zinc-800/40 rounded-xl text-center gap-1"
                        style={{
                          minHeight: `${g.visitantes.length * 58 + (g.visitantes.length - 1) * 6}px`,
                        }}
                      >
                        {g.placa ? (
                          <div className="flex flex-col items-center gap-1 text-zinc-300">
                            <div className="flex items-center gap-1.5">
                              <IconCar size={14} className="text-blue-400" />
                              <span className="font-mono text-xs font-bold bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-md uppercase">
                                {g.placa}
                              </span>
                            </div>
                            {photos.length > 0 && (
                              <Button
                                size="xs"
                                variant="light"
                                color="indigo"
                                radius="xl"
                                leftSection={<IconPaperclip size={11} />}
                                onClick={() => handleOpenEvidencias(photos)}
                                className="bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/10 h-4.5 px-1.5 text-[9px] font-bold mt-0.5"
                              >
                                Fotos ({photos.length})
                              </Button>
                            )}
                          </div>
                        ) : (
                          <Text size="xs" className="text-zinc-500 italic">No</Text>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            },
          },
          {
            accessor: "visitantes",
            title: "Visitantes / Salida / Documento",
            width: 440,
            render: (r: RecepcionVisitaResponse) => {
              const grupos = getGruposVehiculo(r);

              if (grupos.length === 0) {
                return <Text size="xs" className="text-zinc-500 italic text-center">Sin visitantes</Text>;
              }

              return (
                <div className="flex flex-col gap-1.5 w-full">
                  {grupos.map((g, gIdx) => (
                    <div key={gIdx} className="flex flex-col gap-1.5 w-full">
                      {g.visitantes.map((v, idx) => (
                        <div
                          key={idx}
                          className="flex flex-col justify-center gap-1 p-2 min-h-14.5 bg-zinc-900/30 border border-zinc-800/40 rounded-xl hover:border-[#7A604D]/20 transition-all duration-200 text-left"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <Text size="xs" className="text-zinc-200" fw={700}>
                                  {v.visitante_nombre} {v.visitante_apellido}
                                </Text>
                                {v.es_conductor && (
                                  <Badge size="xs" color="blue" variant="filled">
                                    Conductor
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <Text size="10px" className="text-zinc-500 font-mono">
                                  DNI: {v.visitante_dni || "Sin DNI"} {v.visitante_telefono ? `| Tel: ${v.visitante_telefono}` : ""}
                                </Text>
                                {(() => {
                                  const parseList = (raw: string[] | string | null | undefined): string[] => {
                                    if (!raw) return [];
                                    if (Array.isArray(raw)) return raw;
                                    try {
                                      const parsed = JSON.parse(raw);
                                      return Array.isArray(parsed) ? parsed : [];
                                    } catch {
                                      return [];
                                    }
                                  };

                                  const docPhotos = parseList(v.url_foto_documento);
                                  const exitPhotos = parseList(v.evidencias_salida);
                                  const allVisitorFiles = Array.from(new Set([...docPhotos, ...exitPhotos]));

                                  if (allVisitorFiles.length === 0) return null;

                                  return (
                                    <Button
                                      size="xs"
                                      variant="light"
                                      color="indigo"
                                      radius="xl"
                                      leftSection={<IconPaperclip size={11} />}
                                      onClick={() => {
                                        const mapped: IArchivo[] = allVisitorFiles.map((url) => {
                                          const nombre_original = url.split("/").pop() || "Evidencia";
                                          const extension = nombre_original.split(".").pop() || null;
                                          return {
                                            url,
                                            path_relativo: "",
                                            nombre_original,
                                            extension,
                                          };
                                        });
                                        handleOpenEvidencias(mapped);
                                      }}
                                      className="bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/10 h-4.5 px-1.5 text-[9px] font-bold"
                                    >
                                      Ver ({allVisitorFiles.length})
                                    </Button>
                                  );
                                })()}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border ${
                                  v.estado === "En Planta"
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                    : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                                }`}
                              >
                                {v.estado || "En Planta"}
                              </span>

                              {(v.estado === "En Planta" || !v.estado) && (
                                <Button
                                  size="xs"
                                  color="red"
                                  variant="light"
                                  radius="md"
                                  onClick={() => {
                                    setExitRecord({
                                      idDetalle: v.id_detalle,
                                      visitanteNombre: `${v.visitante_nombre} ${v.visitante_apellido}`,
                                    });
                                    setObservacionSalida("");
                                    setEvidenciasSalida([]);
                                  }}
                                  className="bg-red-500/10 hover:bg-red-500/25 text-red-400 font-bold h-5 px-2 text-[9px]"
                                >
                                  Salida
                                </Button>
                              )}
                            </div>
                          </div>

                          {v.estado !== "En Planta" && v.estado && (
                            <div className="text-[10px] text-zinc-400 mt-0.5 pt-1 border-t border-zinc-800/40">
                              <span className="font-semibold text-zinc-500 text-[9px] mr-1">Salida:</span>
                              <span className="font-mono text-zinc-300 mr-2">{v.fecha_hora_salida ? formatFecha(v.fecha_hora_salida) : "—"}</span>
                              {v.observacion_salida && (
                                <span className="italic text-zinc-400">({v.observacion_salida})</span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              );
            },
          },
        ]}
      />

      <ModalEstandar
        opened={modalOpen}
        close={() => {
          setModalOpen(false);
          setSelectedEvidencias(null);
        }}
        title="Documentos Adjuntos"
        size="md"
      >
        <div className="flex flex-col gap-3">
          {selectedEvidencias?.map((e, idx) => (
            <ArchivoCard key={idx} archivo={e} />
          ))}
        </div>
      </ModalEstandar>

      {/* Modal: Registro de Salida Individual */}
      <ModalEstandar
        opened={!!exitRecord}
        close={() => setExitRecord(null)}
        title={`Registrar Salida: ${exitRecord?.visitanteNombre || ""}`}
        size="md"
      >
        <div className="flex flex-col gap-4">
          <Text size="xs" className="text-zinc-400 mb-1 font-semibold uppercase tracking-wider">
            Confirmación de Salida
          </Text>
          <Text size="sm" className="text-zinc-200">
            ¿Está seguro de registrar la salida del visitante <strong className="text-white">{exitRecord?.visitanteNombre}</strong>?
          </Text>
          <Textarea
            label="Observación de Salida (Opcional)"
            placeholder="Escriba alguna observación de salida..."
            value={observacionSalida}
            onChange={(e) => setObservacionSalida(e.target.value)}
            minRows={3}
            classNames={{
              input: "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all",
              label: "text-zinc-400 mb-1 font-medium text-xs ml-1",
            }}
          />
          <MultiFilePicker
            label="Evidencias de Salida"
            files={evidenciasSalida}
            onFilesChange={setEvidenciasSalida}
          />
          <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-zinc-800">
            <Button
              type="button"
              variant="subtle"
              color="gray"
              onClick={() => setExitRecord(null)}
              classNames={{ root: "text-zinc-400 hover:bg-zinc-800" }}
            >
              Cerrar
            </Button>
            <Button
              type="button"
              onClick={handleSaveExit}
              loading={savingExit}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20"
            >
              Confirmar Salida
            </Button>
          </div>
        </div>
      </ModalEstandar>

      {/* Modal: Registrar Salida General de la Recepción */}
      <ModalEstandar
        opened={!!exitGeneralRecord}
        close={() => setExitGeneralRecord(null)}
        title={`Registrar Salida General (Visita #${exitGeneralRecord?.id || ""})`}
        size="md"
      >
        <div className="flex flex-col gap-4">
          <Text size="xs" className="text-zinc-400 font-semibold uppercase tracking-wider">
            Confirmación de Salida General
          </Text>
          <Text size="sm" className="text-zinc-200">
            ¿Está seguro de registrar la salida general de todos los visitantes en planta para esta recepción?
          </Text>
          <Textarea
            label="Observación de Salida General (Opcional)"
            placeholder="Escriba alguna observación de salida general..."
            value={observacionSalidaGeneral}
            onChange={(e) => setObservacionSalidaGeneral(e.target.value)}
            minRows={3}
            classNames={{
              input: "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all",
              label: "text-zinc-400 mb-1 font-medium text-xs ml-1",
            }}
          />
          <MultiFilePicker
            label="Evidencias de Salida (Recepción)"
            files={evidenciasSalidaGeneral}
            onFilesChange={setEvidenciasSalidaGeneral}
          />
          <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-zinc-800">
            <Button
              type="button"
              variant="subtle"
              color="gray"
              onClick={() => setExitGeneralRecord(null)}
              classNames={{ root: "text-zinc-400 hover:bg-zinc-800" }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSaveExitGeneral}
              loading={savingExitGeneral}
              className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/20 font-bold"
            >
              Confirmar Salida General
            </Button>
          </div>
        </div>
      </ModalEstandar>

      {/* Modal: Ver Todas las Evidencias (Ingreso, Salida General, Documentos) */}
      <ModalEstandar
        opened={!!viewAllEvidenciasRecord}
        close={() => setViewAllEvidenciasRecord(null)}
        title={`Evidencias de Recepción #${viewAllEvidenciasRecord?.id || ""}`}
        size="lg"
      >
        {viewAllEvidenciasRecord && (() => {
          const grouped = getEvidenciasRecepcionGrouped(viewAllEvidenciasRecord);
          return (
            <div className="flex flex-col gap-6">
              {grouped.ingreso.length > 0 && (
                <div>
                  <Text size="xs" fw={700} className="text-zinc-400 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                    📸 Evidencias de Ingreso ({grouped.ingreso.length})
                  </Text>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {grouped.ingreso.map((e, idx) => (
                      <ArchivoCard key={idx} archivo={e} />
                    ))}
                  </div>
                </div>
              )}

              {grouped.salida.length > 0 && (
                <div>
                  <Text size="xs" fw={700} className="text-zinc-400 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                    🚪 Evidencias de Salida ({grouped.salida.length})
                  </Text>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {grouped.salida.map((e, idx) => (
                      <ArchivoCard key={idx} archivo={e} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </ModalEstandar>
    </>
  );
};
