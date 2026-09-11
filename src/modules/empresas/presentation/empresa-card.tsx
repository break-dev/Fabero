import { useState } from "react";
import {
  Avatar,
  FileButton,
  Stack,
  Text,
  Badge,
  Loader,
  ActionIcon,
  Tooltip,
  Group,
} from "@mantine/core";
import {
  BuildingOffice2Icon,
  PencilSquareIcon,
  BuildingLibraryIcon,
} from "@heroicons/react/24/outline";
import type { RES_Empresa } from "../../../service/responses/empresa";

interface EmpresaCardProps {
  empresa: RES_Empresa;
  onUpdateLogo: (id: number, file: File) => Promise<boolean>;
  onOpenCuentas: (empresa: RES_Empresa) => void;
  onEdit: (empresa: RES_Empresa) => void;
  loadingCuentas?: boolean;
}

export const EmpresaCard = ({
  empresa,
  onUpdateLogo,
  onOpenCuentas,
  onEdit,
  loadingCuentas = false,
}: EmpresaCardProps) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (file: File | null) => {
    if (!file) return;
    setIsUploading(true);
    try {
      await onUpdateLogo(empresa.id_empresa, file);
    } finally {
      setIsUploading(false);
    }
  };

  const cantidad =
    empresa.cantidad_cuentas_bancarias !== undefined
      ? empresa.cantidad_cuentas_bancarias
      : 0;

  return (
    <div className="group relative flex flex-col bg-zinc-900/40 border border-zinc-800/60 rounded-4xl p-5 gap-4 hover:border-indigo-500/40 hover:bg-zinc-900/60 transition-all duration-500 overflow-hidden shadow-xl hover:shadow-indigo-500/10">
      {/* Decorative Gradient Background */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/5 blur-[60px] group-hover:bg-indigo-500/10 transition-colors duration-700" />
      <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-purple-500/5 blur-[60px] group-hover:bg-purple-500/10 transition-colors duration-700" />

      {/* Header: RUC + Cuentas badge */}
      <div className="flex items-center justify-between relative z-10 gap-2">
        <Group gap="xs">
          <Badge
            variant="filled"
            color="indigo"
            size="xs"
            radius="md"
            className="font-bold tracking-tight px-3"
          >
            RUC: {empresa.ruc}
          </Badge>
        </Group>
        <Group gap="xs" wrap="nowrap">
          <Badge
            color={cantidad > 0 ? "blue" : "gray"}
            variant="light"
            size="sm"
            radius="xl"
          >
            {cantidad === 1 ? "1 cuenta" : `${cantidad} cuentas`}
          </Badge>
          <Tooltip label="Editar Empresa" withArrow>
            <ActionIcon
              variant="subtle"
              color="yellow"
              radius="xl"
              size="sm"
              onClick={() => onEdit(empresa)}
            >
              <PencilSquareIcon className="w-4 h-4" />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Gestionar Cuentas" withArrow position="left">
            <ActionIcon
              variant="subtle"
              color="blue"
              radius="xl"
              size="sm"
              onClick={() => onOpenCuentas(empresa)}
              loading={loadingCuentas}
            >
              <BuildingLibraryIcon className="w-4 h-4" />
            </ActionIcon>
          </Tooltip>
        </Group>
      </div>

      {/* Main Info: Logo & Names (Horizontal Layout) */}
      <div className="flex items-center gap-5 relative z-10">
        <div className="relative group/logo shrink-0">
          <FileButton
            onChange={handleFileChange}
            accept="image/png,image/jpeg,image/jpg"
            disabled={isUploading}
          >
            {(props) => (
              <div {...props} className="cursor-pointer relative">
                <Avatar
                  src={empresa.path_logo}
                  size={80}
                  radius={100}
                  className="border-2 border-zinc-800 group-hover:border-indigo-500/40 transition-all duration-500 shadow-xl"
                >
                  <BuildingOffice2Icon className="w-8 h-8 text-zinc-600" />
                </Avatar>

                {/* Overlay Interactivo / Cargador */}
                {isUploading ? (
                  <div className="absolute inset-0 bg-zinc-950/80 rounded-full flex items-center justify-center backdrop-blur-xs border border-indigo-500/30">
                    <Loader size="sm" color="indigo" variant="bars" />
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-indigo-950/60 rounded-full opacity-0 group-hover/logo:opacity-100 transition-opacity flex flex-col items-center justify-center backdrop-blur-[2px]">
                    <PencilSquareIcon className="w-5 h-5 text-white mb-1" />
                    <Text
                      size="8px"
                      fw={800}
                      className="text-white uppercase tracking-tighter"
                    >
                      Cambiar
                    </Text>
                  </div>
                )}
              </div>
            )}
          </FileButton>
        </div>

        <Stack gap={0} className="flex-1 min-w-0">
          <Text
            size="md"
            fw={800}
            className="text-white group-hover:text-indigo-200 transition-colors line-clamp-1 leading-tight"
          >
            {empresa.razon_social}
          </Text>
        </Stack>
      </div>
    </div>
  );
};
