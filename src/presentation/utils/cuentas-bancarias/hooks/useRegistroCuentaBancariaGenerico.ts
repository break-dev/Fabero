import { useState, useEffect } from "react";
import { useNotify } from "../../../../hooks/useNotify";
import type { RES_Banco } from "../../../../service/responses/banco";
import { Moneda } from "../../../../shared/enums/_generic/moneda";
import type {
  CuentaBancariaItem,
  CuentasBancariasAdapter,
  CrearCuentaBancariaPayload,
} from "../../../../shared/interfaces/cuenta-bancaria";

interface PayloadState {
  id_banco: number;
  moneda: Moneda;
  numero_cuenta: string;
  cci: string;
  es_para_detraccion: 1 | 0;
}

const EMPTY_PAYLOAD: PayloadState = {
  id_banco: 0,
  moneda: Moneda.Soles,
  numero_cuenta: "",
  cci: "",
  es_para_detraccion: 0,
};

/**
 * Hook genérico para crear / editar cuentas vía el adapter del módulo.
 * El adapter decide a qué endpoint POST/PUT apuntar.
 */
export const useRegistroCuentaBancariaGenerico = <
  T extends CuentaBancariaItem,
  TEntity,
>(
  adapter: CuentasBancariasAdapter<T, TEntity>,
  entity: TEntity | null,
  bancos: RES_Banco[],
  onCuentaSaved: (cuenta: T) => void,
  cuenta?: T | null,
) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { notifySuccess, notifyError } = useNotify();

  const initial: PayloadState = cuenta
    ? {
        id_banco: cuenta.id_banco,
        moneda: cuenta.moneda,
        numero_cuenta: cuenta.numero_cuenta,
        cci: cuenta.cci ?? "",
        es_para_detraccion: cuenta.es_para_detraccion ? 1 : 0,
      }
    : { ...EMPTY_PAYLOAD };

  const [payload, setPayload] = useState<PayloadState>(initial);

  useEffect(() => {
    if (payload.id_banco === 0 && bancos.length > 0 && !cuenta) {
      handleSelectBanco(bancos[0].id_banco.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bancos]);

  const handleChangeStr = (field: keyof PayloadState, value: string) => {
    setPayload((prev) => {
      const next: PayloadState = { ...prev, [field]: value as never };
      if (field === "moneda" && value !== Moneda.Soles) {
        next.es_para_detraccion = 0;
      }
      return next;
    });
    if (error) setError(null);
  };

  const handleSelectBanco = (val: string | null) => {
    const idBanco = val ? Number(val) : 0;
    const banco = bancos.find((b) => b.id_banco === idBanco);
    const esNacional = Boolean(
      banco?.es_nacional ||
        banco?.abreviatura?.trim().toUpperCase() === "BN",
    );
    setPayload((prev) => ({
      ...prev,
      id_banco: idBanco,
      es_para_detraccion:
        esNacional && prev.moneda === Moneda.Soles
          ? prev.es_para_detraccion
          : 0,
    }));
    if (error) setError(null);
  };

  const handleToggleDetraccion = (checked: boolean) => {
    setPayload((prev) => ({
      ...prev,
      es_para_detraccion: checked ? 1 : 0,
    }));
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!entity) {
      setError("Falta enlazar el registro a una entidad padre");
      return;
    }

    if (cuenta) {
      try {
        setIsSubmitting(true);
        const updated = await adapter.editarCuenta(cuenta.id_cuenta_bancaria, {
          id_banco: payload.id_banco,
          moneda: payload.moneda,
          numero_cuenta: payload.numero_cuenta,
          cci: payload.cci || null,
          es_para_detraccion: payload.es_para_detraccion,
        } as CrearCuentaBancariaPayload);
        notifySuccess("Cuenta bancaria actualizada correctamente");
        onCuentaSaved(updated);
      } catch (err) {
        console.error(err);
        notifyError("Error al actualizar la cuenta bancaria");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    const parentId = adapter.getParentId(entity);
    if (!parentId) {
      setError("Falta enlazar el registro a una entidad padre");
      return;
    }

    try {
      setIsSubmitting(true);
      const created = await adapter.crearCuenta(parentId, {
        id_banco: payload.id_banco,
        moneda: payload.moneda,
        numero_cuenta: payload.numero_cuenta,
        cci: payload.cci || null,
        es_para_detraccion: payload.es_para_detraccion,
      } as CrearCuentaBancariaPayload);
      notifySuccess("Cuenta bancaria registrada correctamente");
      setPayload({
        id_banco: bancos.length > 0 ? bancos[0].id_banco : 0,
        moneda: Moneda.Soles,
        numero_cuenta: "",
        cci: "",
        es_para_detraccion: 0,
      });
      onCuentaSaved(created);
    } catch (e) {
      console.error(e);
      notifyError("Error al registrar la cuenta bancaria");
    } finally {
      setIsSubmitting(false);
    }
  };

  const autoSelectBanco = (idBanco: number) => {
    handleSelectBanco(idBanco.toString());
  };

  return {
    payload,
    handleChangeStr,
    handleSelectBanco,
    handleToggleDetraccion,
    submit,
    isSubmitting,
    error,
    autoSelectBanco,
  };
};
