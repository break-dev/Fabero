import dayjs from "dayjs";

/**
 * Convierte un valor en kilos a TN (toneladas) y lo formatea para display.
 * Solo se usa para presentación visual — el valor en BD sigue siendo en kilos.
 */
export const formatTn = (kg: number | null | undefined): string => {
  if (kg === null || kg === undefined) return "—";
  return `${(kg / 1000).toFixed(2)} TN`;
};

/**
 * Formatea un ISO datetime a "DD/MM/YYYY HH:mm" en zona local.
 * Devuelve "—" si el valor es null/undefined o vacío.
 */
export const formatDateTime = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  return dayjs(iso).format("DD/MM/YYYY HH:mm");
};
