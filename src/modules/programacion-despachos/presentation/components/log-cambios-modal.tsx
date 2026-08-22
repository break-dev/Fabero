import { useEffect, useState } from "react";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";
import { CambiosLogViewer } from "../../../../presentation/utils/cambios-log-viewer";
import type { RES_CambiosLog } from "../../../../service/responses/_generic/cambios-log";

interface Props {
  opened: boolean;
  onClose: () => void;
  titulo: string;
  cambios: RES_CambiosLog[] | null | undefined;
}

export const LogCambiosModal = ({ opened, onClose, titulo, cambios }: Props) => {
  const [internalOpened, setInternalOpened] = useState(opened);

  useEffect(() => {
    setInternalOpened(opened);
  }, [opened]);

  return (
    <ModalEstandar
      opened={internalOpened}
      close={onClose}
      title={titulo}
      size="md"
    >
      <CambiosLogViewer
        cambios={cambios}
        camposLegiblesCustom={{ estado: "Estado de distribución" }}
      />
    </ModalEstandar>
  );
};