import { useState, useEffect } from "react";
import {
  Stack,
  Group,
  Button,
  Text,
  Badge,
  Image,
  Modal,
} from "@mantine/core";
import { IconPhoto, IconEye } from "@tabler/icons-react";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";

interface Props {
  opened: boolean;
  title?: string;
  fotosNuevas?: File[];
  fotosExistentes?: string[];
  onClose: () => void;
}

const LocalFotoCard = ({
  file,
  idx,
  onAmpliar,
}: {
  file: File;
  idx: number;
  onAmpliar: (url: string) => void;
}) => {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const url = URL.createObjectURL(file);

    Promise.resolve().then(() => {
      if (isMounted) setPreview(url);
    });

    return () => {
      isMounted = false;
      URL.revokeObjectURL(url);
    };
  }, [file]);

  if (!preview) return null;

  return (
    <div
      key={`nueva-${idx}`}
      className="group relative rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden shadow-sm aspect-square flex flex-col justify-between"
    >
      <Image
        src={preview}
        alt={`Foto nueva ${idx + 1}`}
        className="w-full h-full object-cover transition-transform group-hover:scale-105"
      />

      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        <Button
          size="compact-xs"
          variant="filled"
          color="indigo"
          radius="xl"
          leftSection={<IconEye size={12} />}
          onClick={() => onAmpliar(preview)}
        >
          Ampliar
        </Button>
      </div>

      <div className="absolute top-2 left-2">
        <Badge size="xs" variant="filled" color="indigo">
          Nueva
        </Badge>
      </div>
    </div>
  );
};

export const VerFotosModal = ({
  opened,
  title = "Visualizador de Fotos",
  fotosNuevas = [],
  fotosExistentes = [],
  onClose,
}: Props) => {
  const [fotoAmpliada, setFotoAmpliada] = useState<string | null>(null);

  const totalFotos = fotosNuevas.length + fotosExistentes.length;

  return (
    <>
      <ModalEstandar opened={opened} close={onClose} title={title} size="lg">
        <Stack gap="md">
          {totalFotos === 0 ? (
            <div className="py-8 text-center border border-dashed border-zinc-800 rounded-xl">
              <IconPhoto className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
              <Text size="xs" c="zinc.5">
                No hay fotos adjuntas para mostrar.
              </Text>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-1">
              {/* Fotos Existentes */}
              {fotosExistentes.map((url, idx) => (
                <div
                  key={`existente-${idx}`}
                  className="group relative rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden shadow-sm aspect-square flex flex-col justify-between"
                >
                  <Image
                    src={url}
                    alt={`Foto existente ${idx + 1}`}
                    fallbackSrc="https://placehold.co/200x200?text=Error+Imagen"
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />

                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="compact-xs"
                      variant="filled"
                      color="indigo"
                      radius="xl"
                      leftSection={<IconEye size={12} />}
                      onClick={() => setFotoAmpliada(url)}
                    >
                      Ampliar
                    </Button>
                  </div>

                  <div className="absolute top-2 left-2">
                    <Badge size="xs" variant="filled" color="emerald">
                      Existente
                    </Badge>
                  </div>
                </div>
              ))}

              {/* Fotos Nuevas (Locales) */}
              {fotosNuevas.map((file, idx) => (
                <LocalFotoCard
                  key={`local-${file.name}-${idx}`}
                  file={file}
                  idx={idx}
                  onAmpliar={(url) => setFotoAmpliada(url)}
                />
              ))}
            </div>
          )}

          <Group justify="flex-end" className="pt-2 border-t border-zinc-800">
            <Button
              variant="subtle"
              onClick={onClose}
              radius="xl"
              size="xs"
              className="text-zinc-400 hover:text-white"
            >
              Cerrar
            </Button>
          </Group>
        </Stack>
      </ModalEstandar>

      {/* Modal para ver imagen a tamaño completo */}
      <Modal
        opened={Boolean(fotoAmpliada)}
        onClose={() => setFotoAmpliada(null)}
        title="Vista previa de imagen"
        centered
        size="xl"
        classNames={{
          content: "bg-zinc-950 text-white border border-zinc-800 rounded-2xl",
          header: "bg-zinc-950 border-b border-zinc-800 text-white",
        }}
      >
        {fotoAmpliada && (
          <div className="flex items-center justify-center p-2 max-h-[75vh] overflow-auto">
            <Image
              src={fotoAmpliada}
              alt="Foto ampliada"
              radius="md"
              className="max-h-[70vh] object-contain"
            />
          </div>
        )}
      </Modal>
    </>
  );
};
