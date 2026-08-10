import { Stack } from "@mantine/core";
import { useTitlePage } from "../../../../hooks/useTitlePage";
import { useEmpresasTransporte } from "../../hooks/useEmpresasTransporte";
import { RegistroEmpresaTransporte } from "../../../../presentation/utils/registro-empresa-transporte";
import { useState } from "react";
import type { EmpresaTransporteResponse } from "../../service/empresas-transporte.responses";
import { Filtros } from "./components/filtros";
import { EmpresaTransporte } from "./components/empresa-transporte";
import { ModalEstandar } from "../../../../presentation/utils/modal-estandar";

export const EmpresasTransportePage = () => {
  useTitlePage("Empresas de Transporte");

  const {
    empresas,
    loading,
    togglingIds,
    searchQuery,
    setSearchQuery,
    insertEmpresa,
    updateEmpresa,
    toggleEstado,
  } = useEmpresasTransporte();

  const [openRegistro, setOpenRegistro] = useState(false);
  const [empresaAEditar, setEmpresaAEditar] = useState<EmpresaTransporteResponse | null>(null);

  return (
    <div className="space-y-6 animate-fade-in">
      <Stack gap="md">
        <Filtros
          onOpenRegistro={() => setOpenRegistro(true)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        <EmpresaTransporte
          empresas={empresas}
          loading={loading}
          togglingIds={togglingIds}
          onEdit={(e) => setEmpresaAEditar(e)}
          onToggleEstado={toggleEstado}
        />
      </Stack>

      {/* Modal: Registro de Empresa */}
      <ModalEstandar
        opened={openRegistro}
        close={() => setOpenRegistro(false)}
        title="Nueva Empresa de Transporte"
        size="lg"
      >
        <RegistroEmpresaTransporte
          onCancel={() => setOpenRegistro(false)}
          onSuccess={(e) => {
            insertEmpresa(e);
            setOpenRegistro(false);
          }}
        />
      </ModalEstandar>

      {/* Modal: Editar Empresa */}
      <ModalEstandar
        opened={!!empresaAEditar}
        close={() => setEmpresaAEditar(null)}
        title={empresaAEditar ? `Editar Empresa de Transporte: ${empresaAEditar.razon_social}` : ""}
        size="lg"
      >
        {empresaAEditar && (
          <RegistroEmpresaTransporte
            empresa={empresaAEditar}
            onCancel={() => setEmpresaAEditar(null)}
            onSuccess={(e) => {
              updateEmpresa(e);
              setEmpresaAEditar(null);
            }}
          />
        )}
      </ModalEstandar>
    </div>
  );
};
