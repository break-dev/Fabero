import {
  Button,
  Group,
  Grid,
  TextInput,
  Stack,
  Avatar,
  FileButton,
  Text,
  Select,
  Loader,
} from "@mantine/core";
import {
  PhotoIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";

interface RegistroEmpresaProps {
  // Identidad
  ruc: string;
  setRuc: (val: string) => void;
  razonSocial: string;
  setRazonSocial: (val: string) => void;
  logoFile: File | null;
  setLogoFile: (file: File | null) => void;

  // Ubigeo
  idDepartamento: string | null;
  setIdDepartamento: (val: string | null) => void;
  idProvincia: string | null;
  setIdProvincia: (val: string | null) => void;
  idDistrito: string | null;
  setIdDistrito: (val: string | null) => void;
  domicilioFiscal: string;
  setDomicilioFiscal: (val: string) => void;

  departamentos: { id: number; nombre: string }[];
  provincias: { id: number; nombre: string }[];
  distritos: { id: number; nombre: string }[];
  loadingDepartamentos: boolean;
  loadingProvincias: boolean;
  loadingDistritos: boolean;

  // Estado UI
  error: string;
  loading: boolean;
  isEdit: boolean;

  // Acciones
  onSave: () => void;
  onCancel: () => void;
}

export const RegistroEmpresa = ({
  ruc,
  setRuc,
  razonSocial,
  setRazonSocial,
  logoFile,
  setLogoFile,
  idDepartamento,
  setIdDepartamento,
  idProvincia,
  setIdProvincia,
  idDistrito,
  setIdDistrito,
  domicilioFiscal,
  setDomicilioFiscal,
  departamentos,
  provincias,
  distritos,
  loadingDepartamentos,
  loadingProvincias,
  loadingDistritos,
  error,
  loading,
  isEdit,
  onSave,
  onCancel,
}: RegistroEmpresaProps) => {
  const inputClasses = {
    input: `bg-zinc-900/50 border-zinc-800 focus:border-zinc-300
    focus:ring-1 focus:ring-zinc-300 text-white placeholder:text-zinc-500`,
    label: "text-zinc-300 mb-1 font-medium",
  };

  const selectClasses = {
    ...inputClasses,
    dropdown: "bg-zinc-950 border-zinc-800 text-white",
    option: "hover:bg-zinc-900 text-zinc-300 data-[selected]:bg-indigo-600 data-[selected]:text-white",
  };

  const logoPreview = logoFile ? URL.createObjectURL(logoFile) : null;

  return (
    <Stack gap="sm">
      {/* Logo (solo creación; en edición se gestiona desde la card) */}
      {!isEdit && (
        <div className="flex flex-col items-center justify-center py-6">
          <FileButton
            onChange={setLogoFile}
            accept="image/png,image/jpeg,image/jpg"
          >
            {(props) => (
              <div
                {...props}
                className="relative cursor-pointer group rounded-full overflow-hidden border-2 border-indigo-500/30 bg-indigo-600/10 transition-all duration-300 hover:border-indigo-400 hover:bg-indigo-600/20"
                style={{ width: 120, height: 120 }}
              >
                <Avatar
                  src={logoPreview}
                  size={120}
                  radius={100}
                  className="bg-transparent"
                >
                  <PhotoIcon className="w-12 h-12 text-indigo-400/40" />
                </Avatar>

                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-2 text-center">
                  <PencilIcon className="w-6 h-6 text-white mb-2 drop-shadow-md" />
                  <Text size="11px" fw={700} className="text-white leading-tight">
                    {logoFile ? "Cambiar imagen" : "Subir imagen"}
                  </Text>
                </div>
              </div>
            )}
          </FileButton>
        </div>
      )}

      <Grid gutter="sm">
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <TextInput
            label="RUC"
            placeholder="Ej. 20123456789"
            required
            withAsterisk
            disabled={loading}
            radius="lg"
            maxLength={11}
            classNames={inputClasses}
            value={ruc}
            onChange={(e) => setRuc(e.currentTarget.value)}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 4 }}>
          <TextInput
            label="Razón Social"
            placeholder="Ej. Fabero S.A.C."
            required
            withAsterisk
            disabled={loading}
            radius="lg"
            classNames={inputClasses}
            value={razonSocial}
            onChange={(e) => setRazonSocial(e.currentTarget.value)}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 4 }}>
          <TextInput
            label="Domicilio Fiscal"
            placeholder="Ej. Av. Industrial 123"
            disabled={loading}
            radius="lg"
            maxLength={50}
            classNames={inputClasses}
            value={domicilioFiscal}
            onChange={(e) => setDomicilioFiscal(e.currentTarget.value)}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 4 }}>
          <Select
            label="Departamento"
            placeholder={loadingDepartamentos ? "Cargando..." : "Seleccione"}
            searchable
            clearable
            disabled={loading || loadingDepartamentos}
            radius="lg"
            classNames={selectClasses}
            data={departamentos.map((d) => ({
              value: String(d.id),
              label: d.nombre,
            }))}
            value={idDepartamento}
            onChange={setIdDepartamento}
            rightSection={loadingDepartamentos ? <Loader size={14} /> : undefined}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 4 }}>
          <Select
            label="Provincia"
            placeholder={
              !idDepartamento
                ? "Seleccione un departamento"
                : loadingProvincias
                  ? "Cargando..."
                  : "Seleccione"
            }
            searchable
            clearable
            disabled={loading || !idDepartamento || loadingProvincias}
            radius="lg"
            classNames={selectClasses}
            data={provincias.map((p) => ({
              value: String(p.id),
              label: p.nombre,
            }))}
            value={idProvincia}
            onChange={setIdProvincia}
            rightSection={loadingProvincias ? <Loader size={14} /> : undefined}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 4 }}>
          <Select
            label="Distrito"
            placeholder={
              !idProvincia
                ? "Seleccione una provincia"
                : loadingDistritos
                  ? "Cargando..."
                  : "Seleccione"
            }
            searchable
            clearable
            disabled={loading || !idProvincia || loadingDistritos}
            radius="lg"
            classNames={selectClasses}
            data={distritos.map((d) => ({
              value: String(d.id),
              label: d.nombre,
            }))}
            value={idDistrito}
            onChange={setIdDistrito}
            rightSection={loadingDistritos ? <Loader size={14} /> : undefined}
          />
        </Grid.Col>
      </Grid>

      {error && (
        <div className="text-red-500 text-sm font-medium px-1 bg-red-500/10 p-2 rounded-lg border border-red-500/20">
          {error}
        </div>
      )}

      <Group justify="flex-end" gap="md" mt="xl">
        <Button
          variant="subtle"
          onClick={onCancel}
          disabled={loading}
          radius="lg"
          size="sm"
          className="text-zinc-400 hover:text-white
          hover:bg-zinc-800/50 transition-colors"
        >
          Cancelar
        </Button>
        <Button
          loading={loading}
          onClick={onSave}
          radius="lg"
          size="sm"
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20 border-0 px-8"
        >
          {isEdit ? "Guardar Cambios" : "Registrar Empresa"}
        </Button>
      </Group>
    </Stack>
  );
};
