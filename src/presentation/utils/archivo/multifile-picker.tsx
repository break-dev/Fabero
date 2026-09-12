import {
  Group,
  Stack,
  Text,
  Paper,
  ActionIcon,
  Tooltip,
  FileButton,
  Button,
  Image,
  Badge,
} from "@mantine/core";
import { useState, useEffect } from "react";
import {
  IconUpload,
  IconTrash,
  IconPaperclip,
  IconX,
  IconCloudCheck,
} from "@tabler/icons-react";
import {
  getFileTypeConfig,
  FILE_TYPES,
} from "../../../shared/variables/file-types";
import type { IArchivo } from "../../../shared/interfaces/archivo";

// Componente interno para cada archivo nuevo (local File) con previsualización
const LocalFileCard = ({
  file,
  onRemove,
}: {
  file: File;
  onRemove: () => void;
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  const config = getFileTypeConfig(extension);
  const isImage = FILE_TYPES.IMAGE.extensions.includes(extension);

  useEffect(() => {
    if (!isImage) return;

    let isMounted = true;
    const url = URL.createObjectURL(file);

    // Actualización asíncrona para evitar el warning de cascading render
    Promise.resolve().then(() => {
      if (isMounted) setPreview(url);
    });

    return () => {
      isMounted = false;
      URL.revokeObjectURL(url);
    };
  }, [file, isImage]);

  return (
    <Paper
      p="xs"
      radius="lg"
      className="bg-zinc-900/40 border border-zinc-800/80 hover:border-indigo-500/30 transition-all group/file shadow-sm overflow-hidden"
    >
      <div className="flex items-center gap-2">
        {/* Thumbnail or Icon */}
        <div className="w-10 h-10 rounded-lg bg-zinc-950 flex items-center justify-center shrink-0 border border-zinc-800/50 overflow-hidden relative shadow-inner">
          {isImage && preview ? (
            <Image
              src={preview}
              alt={file.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={`text-${config.color.split(".")[0]}-400`}>
              <config.icon size={20} stroke={2} />
            </div>
          )}
        </div>

        {/* Content - min-w-0 is CRITICAL for truncate to work in flex */}
        <div className="min-w-0 flex-1">
          <Tooltip label={file.name} position="top" radius="sm" openDelay={500}>
            <Text
              size="xs"
              fw={800}
              className="text-zinc-200 truncate cursor-default leading-tight"
            >
              {file.name}
            </Text>
          </Tooltip>
          <Group gap={4} wrap="nowrap" mt={2} align="center">
            <Badge
              size="xs"
              variant="light"
              color="indigo"
              radius="sm"
              className="uppercase font-extrabold tracking-wider"
            >
              Nuevo
            </Badge>
            <Text size="10px" c="zinc.5" fw={800} className="uppercase tracking-widest">
              {(file.size / 1024 / 1024).toFixed(2)} MB • {extension}
            </Text>
          </Group>
        </div>

        {/* Action on the right - shrink-0 to prevent it from being pushed */}
        <ActionIcon
          variant="light"
          color="red"
          size="md"
          radius="md"
          onClick={onRemove}
          className="bg-red-500/5 hover:bg-red-500/10 opacity-0 group-hover/file:opacity-100 transition-opacity shrink-0"
        >
          <IconTrash size={16} stroke={2} />
        </ActionIcon>
      </div>
    </Paper>
  );
};

// Componente interno para archivos existentes (IArchivo del backend)
const ExistingFileCard = ({
  archivo,
  onRemove,
}: {
  archivo: IArchivo;
  onRemove: () => void;
}) => {
  const extension = (archivo.extension || "").toLowerCase().replace(".", "");
  const config = getFileTypeConfig(extension);
  const isImage = FILE_TYPES.IMAGE.extensions.includes(extension);
  const nombre = archivo.nombre_original || "Sin nombre";

  return (
    <Paper
      p="xs"
      radius="lg"
      className="bg-zinc-900/40 border border-zinc-800/80 hover:border-emerald-500/30 transition-all group/file shadow-sm overflow-hidden"
    >
      <div className="flex items-center gap-2">
        {/* Thumbnail or Icon */}
        <div className="w-10 h-10 rounded-lg bg-zinc-950 flex items-center justify-center shrink-0 border border-zinc-800/50 overflow-hidden relative shadow-inner">
          {isImage ? (
            <Image
              src={archivo.url}
              alt={nombre}
              fallbackSrc="https://placehold.co/100x100?text=..."
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={`text-${config.color.split(".")[0]}-400`}>
              <config.icon size={20} stroke={2} />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <Tooltip label={nombre} position="top" radius="sm" openDelay={500}>
            <Text
              size="xs"
              fw={800}
              className="text-zinc-200 truncate cursor-default leading-tight"
            >
              {nombre}
            </Text>
          </Tooltip>
          <Group gap={4} wrap="nowrap" mt={2} align="center">
            <Badge
              size="xs"
              variant="light"
              color="emerald"
              radius="sm"
              leftSection={<IconCloudCheck size={10} stroke={2.5} />}
              className="uppercase font-extrabold tracking-wider"
            >
              Existente
            </Badge>
            <Text size="10px" c="zinc.5" fw={800} className="uppercase tracking-widest">
              {extension || "FILE"}
            </Text>
          </Group>
        </div>

        {/* Action on the right */}
        <ActionIcon
          variant="light"
          color="red"
          size="md"
          radius="md"
          onClick={onRemove}
          className="bg-red-500/5 hover:bg-red-500/10 opacity-0 group-hover/file:opacity-100 transition-opacity shrink-0"
        >
          <IconTrash size={16} stroke={2} />
        </ActionIcon>
      </div>
    </Paper>
  );
};

interface MultiFilePickerProps extends React.ComponentPropsWithoutRef<"div"> {
  files: File[];
  onFilesChange: (files: File[]) => void;
  existingFiles?: IArchivo[];
  onRemoveExisting?: (path_relativo: string) => void;
  label?: string;
  description?: string;
  maxFiles?: number;
  accept?: string;
  multiple?: boolean;
}

export const MultiFilePicker = ({
  files,
  onFilesChange,
  existingFiles = [],
  onRemoveExisting,
  label,
  description = "Imágenes o documentos: PDF, JPG, PNG, etc.",
  maxFiles,
  accept = "*",
  multiple = true,
  className = "",
  ...props
}: MultiFilePickerProps) => {
  const handleFilesChange = (payload: File | File[] | null) => {
    if (!payload) return;

    if (Array.isArray(payload)) {
      const combined = [...files, ...payload];
      if (maxFiles && combined.length > maxFiles) {
        onFilesChange(combined.slice(0, maxFiles));
      } else {
        onFilesChange(combined);
      }
    } else {
      if (multiple) {
        onFilesChange([...files, payload]);
      } else {
        onFilesChange([payload]);
      }
    }
  };

  const handleRemoveFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  const handleRemoveExisting = (path_relativo: string) => {
    if (onRemoveExisting) {
      onRemoveExisting(path_relativo);
    }
  };

  const handleClearAll = () => {
    onFilesChange([]);
  };

  const totalCount = files.length + existingFiles.length;
  const hasItems = totalCount > 0;

  return (
    <Stack gap="xs" className={className} {...props}>
      {/* Header */}
      <Group justify="space-between" align="flex-end">
        <div>
          {label && (
            <Text
              size="xs"
              fw={800}
              className="text-zinc-100 uppercase tracking-widest mb-0.5"
            >
              {label}
            </Text>
          )}
          {description && (
            <Tooltip
              label={description}
              position="top-start"
              withArrow
              multiline
              w={300}
            >
              <Text
                size="xs"
                c="zinc.5"
                fw={600}
                className="truncate max-w-62.5"
              >
                {description}
              </Text>
            </Tooltip>
          )}
        </div>

        <Group gap="xs">
          {files.length > 0 && (
            <Button
              variant="subtle"
              color="gray"
              size="xs"
              radius="md"
              onClick={handleClearAll}
              leftSection={<IconX size={14} />}
              className="text-zinc-500 hover:text-zinc-300"
            >
              Limpiar nuevos
            </Button>
          )}
          <FileButton
            onChange={handleFilesChange}
            accept={accept}
            multiple={multiple}
          >
            {(props) => (
              <Button
                {...props}
                variant="light"
                color="indigo"
                size="xs"
                radius="md"
                className="font-bold border border-indigo-500/20 shadow-sm"
                leftSection={<IconUpload size={16} />}
              >
                {files.length > 0 ? "Agregar más" : "Adjuntar archivos"}
              </Button>
            )}
          </FileButton>
        </Group>
      </Group>

      {/* Grid of files (existing first, then new) */}
      {hasItems ? (
        <div
          className={`grid gap-2 ${
            totalCount === 1
              ? "grid-cols-1"
              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {existingFiles.map((archivo) => (
            <ExistingFileCard
              key={`existing-${archivo.path_relativo}`}
              archivo={archivo}
              onRemove={() => handleRemoveExisting(archivo.path_relativo)}
            />
          ))}
          {files.map((file, index) => (
            <LocalFileCard
              key={`new-${file.name}-${index}`}
              file={file}
              onRemove={() => handleRemoveFile(index)}
            />
          ))}
        </div>
      ) : (
        <Paper
          p="md"
          radius="md"
          className="bg-zinc-900/20 border border-dashed border-zinc-800/80 py-6"
        >
          <Group justify="center" gap="sm">
            <IconPaperclip size={22} className="text-zinc-600" />
            <Text size="xs" c="zinc.5" fw={600} fs="italic">
              No se han seleccionado archivos.
            </Text>
          </Group>
        </Paper>
      )}
    </Stack>
  );
};