import { ConfirmarProgramacionModal } from "./confirmar-programacion-modal";
import type { RecepcionUnidadResponse } from "../../service/recepcion-unidades.responses";

interface Props {
  opened?: boolean;
  onCancel: () => void;
  onSuccess: (r: RecepcionUnidadResponse) => void;
}

/**
 * Componente wrapper para Registro de Recepción Directa (No Programada).
 * Reutiliza íntegramente ConfirmarProgramacionModal en modo directo (programacion = null).
 */
export const RegistroRecepcion = ({ opened = true, onCancel, onSuccess }: Props) => {
  return (
    <ConfirmarProgramacionModal
      opened={opened}
      programacion={null}
      onClose={onCancel}
      onConfirmada={onSuccess}
    />
  );
};
