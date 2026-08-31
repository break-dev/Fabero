import {
  ActionIcon,
  Group,
  Paper,
  Text,
  Tooltip,
  Image,
  Loader,
} from "@mantine/core";
import { IconEye, IconDownload } from "@tabler/icons-react";
import { getFileTypeConfig } from "../../../shared/variables/file-types";
import { useDownloadFile } from "../../../hooks/useDownloadFile";
import type { IArchivo } from "../../../shared/interfaces/archivo";

interface ArchivoCardProps extends React.ComponentPropsWithoutRef<"div"> {
  archivo: IArchivo;
  onView?: (archivo: IArchivo) => void;
  onDownload?: (archivo: IArchivo) => void;
}

export const ArchivoCard = ({
  archivo,
  onView,
  onDownload,
  className = "",
  ...props
}: ArchivoCardProps) => {
  const { downloadFile, viewFile, isLoading } = useDownloadFile();

  const extension = archivo.extension || "unknown";
  const nombreOriginal = archivo.nombre_original || "Sin nombre";

  const config = getFileTypeConfig(extension);
  const isImage = ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(
    extension.toLowerCase().replace(".", ""),
  );

  const handleDownload = () => {
    if (onDownload) {
      onDownload(archivo);
      return;
    }
    // Usamos el path_relativo para una descarga más directa y segura
    downloadFile(archivo.path_relativo, nombreOriginal);
  };

  const handleView = () => {
    if (onView) {
      onView(archivo);
      return;
    }
    viewFile(archivo.url);
  };

  return (
    <Paper
      radius="lg"
      p="sm"
      className={`bg-zinc-950/40 border border-zinc-800/60 hover:border-indigo-500/30 transition-all duration-300 relative group/card overflow-hidden ${className}`}
      {...props}
    >
      <Group gap="md" wrap="nowrap">
        {/* Thumbnail or Icon */}
        <div className="w-12 h-12 rounded-xl border border-zinc-800/80 overflow-hidden flex items-center justify-center bg-zinc-900/50 shrink-0 relative">
          {isImage ? (
            <Image
              src={archivo.url}
              alt={nombreOriginal}
              fallbackSrc="https://placehold.co/100x100?text=..."
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={`text-${config.color.split(".")[0]}-400`}>
              <config.icon className="w-6 h-6" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-2">
          <Tooltip
            label={nombreOriginal}
            position="top"
            radius="md"
            openDelay={300}
          >
            <Text
              size="sm"
              fw={800}
              className="text-zinc-200 truncate leading-tight cursor-default"
            >
              {nombreOriginal}
            </Text>
          </Tooltip>
          <Text
            size="10px"
            fw={700}
            c="zinc.5"
            className="uppercase tracking-widest mt-0.5"
          >
            {extension.toUpperCase().replace(".", "")} • {config.label}
          </Text>
        </div>

        {/* Actions */}
        <Group gap="xs" wrap="nowrap" className="shrink-0">
          <Tooltip label="Ver archivo" position="top" radius="md">
            <ActionIcon
              variant="light"
              color="indigo"
              onClick={handleView}
              radius="md"
              size="md"
              className="bg-indigo-500/10 hover:bg-indigo-500/20"
            >
              <IconEye size={18} stroke={2} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Descargar" position="top" radius="md">
            <ActionIcon
              variant="light"
              color="teal"
              onClick={handleDownload}
              radius="md"
              size="md"
              disabled={isLoading}
              className="bg-teal-500/10 hover:bg-teal-500/20"
            >
              {isLoading ? (
                <Loader size={12} color="teal" />
              ) : (
                <IconDownload size={18} stroke={2} />
              )}
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>

      {/* Decorative accent */}
      <div
        className={`absolute bottom-0 left-0 h-0.5 w-0 group-hover/card:w-full transition-all duration-500 bg-${config.color.split(".")[0]}-500/40`}
      />
    </Paper>
  );
};
