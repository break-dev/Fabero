export const dateToInput = (iso: string | null | undefined): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mn = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${mn}`;
};

export const dateFromInput = (input: string | null | undefined): string | null => {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  const match = trimmed.match(
    /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/
  );
  if (!match) return null;

  const dd = parseInt(match[1], 10);
  const mm = parseInt(match[2], 10) - 1;
  const yyyy = parseInt(match[3], 10);
  const hh = match[4] ? parseInt(match[4], 10) : 0;
  const mn = match[5] ? parseInt(match[5], 10) : 0;

  const d = new Date(yyyy, mm, dd, hh, mn, 0);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
};
