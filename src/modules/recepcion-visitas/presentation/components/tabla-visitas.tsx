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

  const [exitRecord, setExitRecord] = useState<{ idDetalle: number; visitanteNombre: string } | null>(null);
  const [observacionSalida, setObservacionSalida] = useState("");
  const [evidenciasSalida, setEvidenciasSalida] = useState<File[]>([]);
  const [savingExit, setSavingExit] = useState(false);
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
            width: 120,
            textAlign: "center",
            render: (r: RecepcionVisitaResponse) => (
              <div className="flex flex-col items-center justify-center text-center">
                <Text size="xs" className="text-zinc-200" fw={700}>
                  {formatFecha(r.fecha_hora_ingreso)}
                </Text>
                <Text size="10px" className="text-zinc-500">
                  {r.empleado_registro_nombre}
                </Text>
              </div>
            ),
          },
          {
            accessor: "empleado_contacto_nombre",
            title: "Personal Contacto",
            width: 120,
            textAlign: "center",
            render: (r: RecepcionVisitaResponse) => (
              <Text size="xs" className="text-zinc-200 text-center w-full" fw={600}>
                {r.empleado_contacto_nombre}
              </Text>
            ),
          },
          {
            accessor: "motivo_ingreso_nombre",
            title: "Motivo Visita",
            width: 110,
            textAlign: "center",
            render: (r: RecepcionVisitaResponse) => (
              <div className="flex justify-center w-full">
                <span className="inline-flex items-center justify-center bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-0.5 rounded-md font-bold text-xs">
                  {r.motivo_ingreso_nombre}
                </span>
              </div>
            ),
          },
          {
            accessor: "vehiculo",
            title: "Vehículo Particular",
            width: 130,
            textAlign: "center",
            render: (r: RecepcionVisitaResponse) => {
              const tienePlacaHeader = Boolean(r.serie_placa || r.numero_placa);
              const tieneVehiculos = Boolean(r.vehiculos && r.vehiculos.length > 0);

              if (!r.con_vehiculo && !tienePlacaHeader && !tieneVehiculos) {
                return <Text size="xs" className="text-zinc-500 italic text-center w-full">No</Text>;
              }

              return (
                <div className="flex flex-col items-center justify-center gap-1 w-full">
                  {tienePlacaHeader && (
                    <div className="flex items-center gap-1.5 text-zinc-300">
                      <IconCar size={14} className="text-indigo-400" />
                      <span className="font-mono text-xs font-bold bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-md uppercase">
                        {r.serie_placa ? `${r.serie_placa}-` : ""}{r.numero_placa}
                      </span>
                    </div>
                  )}
                  {r.vehiculos?.map((veh, vIdx) => (
                    <div key={vIdx} className="flex items-center gap-1.5 text-zinc-300">
                      <IconCar size={14} className="text-blue-400" />
                      <span className="font-mono text-xs font-bold bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-md uppercase">
                        {veh.placa}
                      </span>
                    </div>
                  ))}
                  {!tienePlacaHeader && !tieneVehiculos && (
                    <div className="flex items-center gap-1 text-zinc-400 text-xs italic">
                      <IconCar size={14} className="text-zinc-500" /> Con vehículo
                    </div>
                  )}
                </div>
              );
            },
          },
          {
            accessor: "observacion",
            title: "Observación",
            width: 130,
            textAlign: "center",
            render: (r: RecepcionVisitaResponse) => (
              <Text size="xs" className="text-zinc-400 italic max-w-32.5 mx-auto text-center" truncate title={r.observacion || ""}>
                {r.observacion || "—"}
              </Text>
            ),
          },
          {
            accessor: "visitantes",
            title: "Visitantes / Salida / Documento",
            width: 440,
            render: (r: RecepcionVisitaResponse) => (
              <div className="flex flex-col gap-1.5 w-full">
                {r.visitantes.map((v, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col gap-1.5 p-2 bg-zinc-900/30 border border-zinc-800/40 rounded-xl hover:border-[#7A604D]/20 transition-all duration-200 text-left"
                  >
                    {/* Fila Principal */}
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
                          {v.url_foto_documento && v.url_foto_documento.length > 0 && (
                            <Button
                              size="xs"
                              variant="light"
                              color="indigo"
                              radius="xl"
                              leftSection={<IconPaperclip size={11} />}
                              onClick={() => {
                                const mapped: IArchivo[] = v.url_foto_documento.map((url) => {
                                  const nombre_original = url.split('/').pop() || "Documento";
                                  const extension = nombre_original.split('.').pop() || null;
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
                              Ver ({v.url_foto_documento.length})
                            </Button>
                          )}
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

                    {/* Fila Detalle de Salida (solo si ya registró salida) */}
                    {v.estado !== "En Planta" && v.estado && (
                      <div className="text-[10px] text-zinc-400 mt-0.5 pt-1 border-t border-zinc-800/40">
                        <span className="font-semibold text-zinc-500 text-[9px] mr-1">Salida:</span>
                        <span className="font-mono text-zinc-300 mr-2">{v.fecha_hora_salida ? formatFecha(v.fecha_hora_salida) : "—"}</span>
                        {v.observacion_salida && (
                          <>
                            <span className="font-semibold text-zinc-500 text-[9px] mr-1">| Obs:</span>
                            <span className="italic text-zinc-300 break-word">{v.observacion_salida}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ),
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

      {/* Modal: Registro de Salida */}
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
    </>
  );
};
