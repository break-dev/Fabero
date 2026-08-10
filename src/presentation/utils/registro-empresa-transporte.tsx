import { IconDeviceFloppy, IconExclamationCircle } from "@tabler/icons-react";
import { Button, Grid, Select, TextInput, Alert } from "@mantine/core";
import { useRegistroEmpresaTransporte } from "../../modules/empresas-transporte/hooks/useRegistroEmpresaTransporte";
import { TipoEntidad } from "../../shared/enums/_generic/tipo-entidad";
import type { EmpresaTransporteResponse } from "../../modules/empresas-transporte/service/empresas-transporte.responses";

interface Props {
  empresa?: EmpresaTransporteResponse | null;
  onCancel: () => void;
  onSuccess: (e: EmpresaTransporteResponse) => void;
}

export const RegistroEmpresaTransporte = ({ empresa, onCancel, onSuccess }: Props) => {
  const { payload, handleChange, handleSelectChange, submit, loading, error } =
    useRegistroEmpresaTransporte((e) => {
      onSuccess(e);
    }, empresa);

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      {error && (
        <Alert
          icon={<IconExclamationCircle size={16} />}
          color="red"
          variant="filled"
          className="mb-2"
        >
          {error}
        </Alert>
      )}

      <Grid>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Select
            label="Tipo de Entidad"
            placeholder="Seleccione"
            searchable
            withAsterisk
            radius="xl"
            data={Object.values(TipoEntidad)}
            value={payload.tipo_entidad}
            onChange={handleSelectChange}
            classNames={{
              input:
                "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 transition-all",
              label: "text-zinc-400 font-medium text-xs mb-1.5",
            }}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <TextInput
            withAsterisk
            label="RUC"
            placeholder="20345678901"
            radius="xl"
            maxLength={11}
            value={payload.ruc || ""}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "");
              handleChange("ruc", val);
            }}
            classNames={{
              input:
                "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 transition-all",
              label: "text-zinc-400 font-medium text-xs mb-1.5",
            }}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <TextInput
            withAsterisk={payload.tipo_entidad === TipoEntidad.Natural}
            disabled={payload.tipo_entidad === TipoEntidad.Juridica}
            label="DNI"
            placeholder={payload.tipo_entidad === TipoEntidad.Natural ? "12345678" : "No aplica"}
            radius="xl"
            maxLength={8}
            value={payload.tipo_entidad === TipoEntidad.Natural ? payload.dni || "" : ""}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "");
              handleChange("dni", val);
            }}
            classNames={{
              input:
                "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 transition-all disabled:opacity-50 disabled:bg-zinc-900/10",
              label: "text-zinc-400 font-medium text-xs mb-1.5",
            }}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12 }}>
          <TextInput
            label="Razón Social / Nombre"
            placeholder="Ej. Trans-Rápido S.A.C."
            radius="xl"
            withAsterisk
            value={payload.razon_social || ""}
            onChange={(e) => handleChange("razon_social", e.target.value)}
            classNames={{
              input:
                "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 transition-all",
              label: "text-zinc-400 font-medium text-xs mb-1.5",
            }}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12 }}>
          <TextInput
            label="Dirección Principal"
            placeholder="Av. Los Transportistas 456, Callao"
            radius="xl"
            value={payload.direccion || ""}
            onChange={(e) => handleChange("direccion", e.target.value)}
            classNames={{
              input:
                "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 transition-all",
              label: "text-zinc-400 font-medium text-xs mb-1.5",
            }}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <TextInput
            label="Teléfono"
            placeholder="Ej. 987654321"
            radius="xl"
            type="tel"
            inputMode="tel"
            maxLength={20}
            value={payload.telefono || ""}
            onChange={(e) => {
              const sanitizado = e.target.value.replace(/[^0-9+\-\s()]/g, "");
              handleChange("telefono", sanitizado);
            }}
            onKeyDown={(e) => {
              if (
                !/[0-9+\-\s()\bBackspace\bDelete\bArrowLeft\bArrowRight\bTab\bEnter]/.test(e.key)
              ) {
                e.preventDefault();
              }
            }}
            onPaste={(e) => {
              const textoPegado = e.clipboardData.getData("text");
              if (/[a-zA-Z]/.test(textoPegado)) {
                e.preventDefault();
              }
            }}
            classNames={{
              input:
                "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 transition-all",
              label: "text-zinc-400 font-medium text-xs mb-1.5",
            }}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <TextInput
            label="Correo Electrónico"
            placeholder="Ej. contacto@empresa.com"
            radius="xl"
            value={payload.correo || ""}
            onChange={(e) => handleChange("correo", e.target.value)}
            classNames={{
              input:
                "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 transition-all",
              label: "text-zinc-400 font-medium text-xs mb-1.5",
            }}
          />
        </Grid.Col>
      </Grid>

      <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-zinc-800">
        <Button
          variant="subtle"
          color="gray"
          radius="xl"
          onClick={onCancel}
          classNames={{ root: "text-zinc-400 hover:bg-zinc-800" }}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          loading={loading}
          radius="xl"
          leftSection={<IconDeviceFloppy size={18} />}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20"
        >
          {empresa ? "Actualizar Empresa" : "Guardar Empresa"}
        </Button>
      </div>
    </form>
  );
};
