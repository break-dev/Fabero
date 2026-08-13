/**
 * Helpers para serializar/deserializar fechas en formato `YYYY-MM-DD`
 * interpretándolas SIEMPRE en zona horaria local (sin conversiones UTC).
 *
 * JavaScript nativo tiene un bug clásico aquí:
 *   - `new Date("2026-08-12")` se interpreta como UTC midnight → en local (UTC-5)
 *     se ve como 2026-08-11T19:00:00, mostrando el día anterior.
 *   - `d.toISOString().slice(0, 10)` convierte a UTC antes de cortar, lo que
 *     también puede retroceder un día si la hora local es 00:00.
 *
 * Estos helpers usan componentes locales (`getFullYear`/`getMonth`/`getDate`)
 * en ambas direcciones para evitar el round-trip.
 */

export const formatLocalDate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const parseLocalDate = (s: string): Date => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
