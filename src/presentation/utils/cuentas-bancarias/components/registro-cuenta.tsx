import {
  Grid,
  Select,
  Switch,
  Alert,
  Loader,
  ActionIcon,
  Tooltip,
  Button,
  TextInput,
} from "@mantine/core";
import { IconPlus, IconExclamationCircle } from "@tabler/icons-react";
import { Moneda } from "../../../../shared/enums/_generic/moneda";
import { MONEDAS } from "../../../../shared/variables/monedas";
import { useRegistroCuentaBancariaGenerico } from "../hooks/useRegistroCuentaBancariaGenerico";
import type { CuentaBancariaItem } from "../../../../shared/interfaces/cuenta-bancaria";
import type { CuentasBancariasAdapter } from "../../../../shared/interfaces/cuenta-bancaria";
import { useState } from "react";
import { RegistroBanco } from "../../registro-banco";
import { ModalEstandar } from "../../modal-estandar";
import type { RES_Banco } from "../../../../service/responses/banco";

/** Solo dígitos — filtra cualquier otra tecla en el paste/type. */
const onlyDigits = (value: string) => value.replace(/\D/g, "");
const MAX_NUMERO_CUENTA = 20;
const MAX_CCI = 20;

interface Props<T extends CuentaBancariaItem, TEntity> {
  adapter: CuentasBancariasAdapter<T, TEntity>;
  entity: TEntity;
  bancos: RES_Banco[];
  loadingBancos: boolean;
  onCuentaAdded: (cuenta: T) => void;
  onBancoAdded: (banco: RES_Banco) => void;
  cuenta?: T | null;
}

export function RegistroCuenta<T extends CuentaBancariaItem, TEntity>({
  adapter,
  entity,
  bancos,
  loadingBancos,
  onCuentaAdded,
  onBancoAdded,
  cuenta,
}: Props<T, TEntity>) {
  const {
    payload,
    handleChangeStr,
    handleSelectBanco,
    handleToggleDetraccion,
    submit,
    isSubmitting,
    error,
    autoSelectBanco,
  } = useRegistroCuentaBancariaGenerico(
    adapter,
    entity,
    bancos,
    onCuentaAdded,
    cuenta,
  );

  const [openBanco, setOpenBanco] = useState(false);

  const selectMonedas = (Object.values(MONEDAS) as Array<{ label: string; symbol: string }>).map(
    (m) => ({
      value: m.label as Moneda,
      label: `${m.label} (${m.symbol})`,
    }),
  );

  const selectBancos = bancos.map((b) => ({
    value: b.id_banco.toString(),
    label: `${b.nombre} ${b.abreviatura ? `(${b.abreviatura})` : ""}`,
  }));

  const selectedBanco = bancos.find((b) => b.id_banco === payload.id_banco);
  const isBancoNacional = Boolean(
    selectedBanco?.es_nacional ||
      selectedBanco?.abreviatura?.trim().toUpperCase() === "BN",
  );

  return (
    <div className="bg-zinc-900/50 p-5 rounded-xl border border-zinc-800">
      {error && (
        <Alert
          icon={<IconExclamationCircle size={16} />}
          color="red"
          variant="filled"
          className="mb-4"
        >
          {error}
        </Alert>
      )}

      <form onSubmit={submit} className="flex flex-col gap-4">
        <Grid>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <div className="flex items-end gap-2">
              <Select
                label="Banco"
                placeholder="Seleccione un banco"
                data={selectBancos}
                disabled={loadingBancos}
                searchable
                radius="xl"
                className="flex-1"
                rightSection={loadingBancos ? <Loader size={16} /> : undefined}
                value={payload.id_banco ? payload.id_banco.toString() : null}
                onChange={handleSelectBanco}
                classNames={{
                  input:
                    "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 transition-all",
                  label: "text-zinc-400 font-medium text-xs",
                }}
              />
              <Tooltip label="Añadir nuevo banco" withArrow>
                <ActionIcon
                  size="input-sm"
                  variant="light"
                  color="blue"
                  radius="xl"
                  onClick={() => setOpenBanco(true)}
                  className="mb-0.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30"
                >
                  <IconPlus size={18} />
                </ActionIcon>
              </Tooltip>
            </div>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Select
              label="Moneda"
              data={selectMonedas}
              radius="xl"
              value={payload.moneda}
              onChange={(val) => handleChangeStr("moneda", val || "")}
              classNames={{
                input:
                  "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-300 transition-all",
                label: "text-zinc-400 font-medium text-xs",
              }}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 4 }}>
            <TextInput
              label="Número de Cuenta"
              radius="xl"
              placeholder="Ingrese el número de cuenta"
              value={payload.numero_cuenta}
              maxLength={MAX_NUMERO_CUENTA}
              inputMode="numeric"
              pattern="[0-9]*"
              onChange={(e) =>
                handleChangeStr("numero_cuenta", onlyDigits(e.target.value))
              }
              onPaste={(e) => {
                const text = e.clipboardData.getData("text");
                const filtered = onlyDigits(text).slice(0, MAX_NUMERO_CUENTA);
                e.preventDefault();
                handleChangeStr("numero_cuenta", filtered);
              }}
              disabled={isSubmitting}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 8 }}>
            <TextInput
              label="Código de Cuenta Interbancario (CCI)"
              radius="xl"
              placeholder="Ingrese el CCI (opcional)"
              value={payload.cci}
              maxLength={MAX_CCI}
              inputMode="numeric"
              pattern="[0-9]*"
              onChange={(e) => handleChangeStr("cci", onlyDigits(e.target.value))}
              onPaste={(e) => {
                const text = e.clipboardData.getData("text");
                const filtered = onlyDigits(text).slice(0, MAX_CCI);
                e.preventDefault();
                handleChangeStr("cci", filtered);
              }}
              disabled={isSubmitting}
            />
          </Grid.Col>

          <Grid.Col span={12}>
            <div className="flex items-center justify-between gap-4 bg-zinc-900/50 border border-zinc-800 p-3 rounded-xl">
              <Switch
                label="Es cuenta de detracción"
                color="yellow"
                checked={payload.es_para_detraccion === 1}
                disabled={
                  !isBancoNacional ||
                  payload.moneda !== Moneda.Soles
                }
                onChange={(e) =>
                  handleToggleDetraccion(e.currentTarget.checked)
                }
                classNames={{ label: "text-zinc-300 font-medium" }}
              />

              <Button
                type="submit"
                loading={isSubmitting}
                radius="xl"
                leftSection={<IconPlus size={18} />}
                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20"
              >
                {cuenta ? "Actualizar Cuenta" : "Agregar Cuenta"}
              </Button>
            </div>
          </Grid.Col>
        </Grid>
      </form>

      {/* Modal: Registro de Banco */}
      <ModalEstandar
        opened={openBanco}
        close={() => setOpenBanco(false)}
        title="Registrar Nuevo Banco"
        size="sm"
      >
        <RegistroBanco
          onCancel={() => setOpenBanco(false)}
          onSuccess={(b) => {
            onBancoAdded(b);
            autoSelectBanco(b.id_banco);
            setOpenBanco(false);
          }}
        />
      </ModalEstandar>
    </div>
  );
}
