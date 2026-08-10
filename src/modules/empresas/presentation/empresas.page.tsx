import {
  Button,
  TextInput,
  Skeleton,
  Text,
} from "@mantine/core";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { useTitlePage } from "../../../hooks/useTitlePage";
import { ModalEstandar } from "../../../presentation/utils/modal-estandar";
import { CuentasBancariasGenerico } from "../../../presentation/utils/cuentas-bancarias";
import { RegistroEmpresa } from "./registro-empresa";
import { useEmpresas } from "../hooks/useEmpresas";
import { useRegistroEmpresa } from "../hooks/useRegistroEmpresa";
import { EmpresaCard } from "./empresa-card";
import { empresaCuentasAdapter } from "../service/cuentas-bancarias.adapter";
import type { CuentaBancariaEmpresaResponse } from "../service/empresas.responses";
import type { RES_Empresa } from "../../../service/responses/empresa";

export const EmpresasPage = () => {
  useTitlePage("Empresas");

  const {
    loading,
    busqueda,
    setBusqueda,
    empresasFiltradas,
    openedCreate,
    openCreate,
    closeCreate,
    onEmpresaCreada,
    handleUpdateLogo,
    actualizarCantidadCuentasEmpresa,
  } = useEmpresas();

  const registro = useRegistroEmpresa({
    onSuccess: onEmpresaCreada,
    onClose: closeCreate,
  });

  const [selectedEmpresaCuentas, setSelectedEmpresaCuentas] =
    useState<RES_Empresa | null>(null);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-end justify-between">
        <div className="flex flex-1 gap-4 w-full">
          <TextInput
            label="Buscar Empresa"
            placeholder="Buscar empresas por nombre o RUC..."
            leftSection={
              <MagnifyingGlassIcon className="w-4 h-4 text-zinc-400" />
            }
            value={busqueda}
            onChange={(e) => setBusqueda(e.currentTarget.value)}
            className="flex-1 min-w-64"
            radius="lg"
            size="sm"
            classNames={{
              input:
                "bg-zinc-900/50 border-zinc-800 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 text-white placeholder:text-zinc-500",
              label: "text-zinc-400 text-xs font-semibold mb-1 ml-1",
            }}
          />
        </div>
        <Button
          leftSection={<PlusIcon className="w-5 h-5" />}
          onClick={openCreate}
          radius="lg"
          size="sm"
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-900/20 shrink-0 px-6 font-semibold h-9.5"
        >
          Nueva Empresa
        </Button>
      </div>

      {/* Grid Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-zinc-900/40 border border-zinc-800/60 rounded-4xl p-5 space-y-4"
            >
              {/* Badge Skeleton */}
              <div className="flex justify-start">
                <Skeleton height={18} width={90} radius="md" />
              </div>

              {/* Content Skeleton (Horizontal) */}
              <div className="flex items-center gap-5">
                <Skeleton height={80} width={80} circle />
                <div className="flex-1 space-y-2">
                  <Skeleton height={16} width="80%" radius="md" />
                  <Skeleton height={12} width="50%" radius="md" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : empresasFiltradas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-zinc-900/10 rounded-[40px] border border-dashed border-zinc-800/50">
          <div className="bg-zinc-900/50 p-6 rounded-full mb-4 border border-zinc-800">
            <Squares2X2Icon className="w-10 h-10 text-zinc-700" />
          </div>
          <Text size="sm" fw={600} className="text-zinc-500">
            No se encontraron empresas registradas
          </Text>
          <Text size="xs" className="text-zinc-600 mt-1">
            Intenta con otro término de búsqueda o registra una nueva
          </Text>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {empresasFiltradas.map((empresa) => (
            <EmpresaCard
              key={empresa.id_empresa}
              empresa={empresa}
              onUpdateLogo={handleUpdateLogo}
              onOpenCuentas={(e) => setSelectedEmpresaCuentas(e)}
            />
          ))}
        </div>
      )}

      {/* Registration Modal */}
      <ModalEstandar
        opened={openedCreate}
        close={closeCreate}
        title="Registrar Empresa"
        size="md"
      >
        <RegistroEmpresa
          ruc={registro.ruc}
          setRuc={registro.setRuc}
          razonSocial={registro.razonSocial}
          setRazonSocial={registro.setRazonSocial}
          nombreComercial={registro.nombreComercial}
          setNombreComercial={registro.setNombreComercial}
          prefijo={registro.prefijo}
          setPrefijo={registro.setPrefijo}
          logoFile={registro.logoFile}
          setLogoFile={registro.setLogoFile}
          error={registro.error}
          loading={registro.loading}
          onSave={registro.handleGuardar}
          onCancel={() => {
            closeCreate();
            registro.reset();
          }}
        />
      </ModalEstandar>

      {/* Modal: Gestión de Cuentas Bancarias */}
      <ModalEstandar
        opened={!!selectedEmpresaCuentas}
        close={() => setSelectedEmpresaCuentas(null)}
        title={
          selectedEmpresaCuentas
            ? `Cuentas Bancarias: ${selectedEmpresaCuentas.razon_social}`
            : ""
        }
        size="xl"
      >
        {selectedEmpresaCuentas && (
          <CuentasBancariasGenerico<
            CuentaBancariaEmpresaResponse,
            RES_Empresa
          >
            entity={selectedEmpresaCuentas}
            adapter={empresaCuentasAdapter}
            onCuentasCountChange={(count) =>
              actualizarCantidadCuentasEmpresa(
                selectedEmpresaCuentas.id_empresa,
                count,
              )
            }
          />
        )}
      </ModalEstandar>
    </div>
  );
};

export default EmpresasPage;
