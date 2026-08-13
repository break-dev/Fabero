/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo, useRef } from "react";
import { DateInput, type DateInputProps } from "@mantine/dates";
import {
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import "@mantine/dates/styles.css";
import "dayjs/locale/es";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

interface CustomDatePickerProps extends Omit<
  DateInputProps,
  "leftSection" | "rightSection" | "value" | "onChange"
> {
  error?: string;
  value?: Date | string | null;
  onChange: (val: Date | null) => void;
}

export const CustomDatePicker = ({
  error,
  label,
  value,
  onChange,
  radius = "lg",
  size = "sm",
  placeholder,
  ...props
}: CustomDatePickerProps) => {
  const ref = useRef<HTMLInputElement>(null);

  // Estilos (sin cambios)
  const inputStyles = {
    input: `bg-zinc-900/50 border-zinc-800 focus:border-zinc-300 focus:ring-1 
    focus:ring-zinc-300 text-white placeholder:text-zinc-500 transition-all`,
    label: "text-zinc-300 mb-1 font-medium",
    calendarHeader: "text-white font-bold",
    calendarHeaderControl: `text-zinc-400 hover:text-white hover:bg-zinc-800 
    rounded-md transition-colors w-8 h-8 flex items-center justify-center`,
    calendarHeaderLevel: `hover:bg-zinc-800 rounded-md px-2 py-1 transition-colors text-white font-bold`,
    day: `text-zinc-300 hover:bg-zinc-800/80 hover:text-white rounded-md 
    data-[selected]:bg-zinc-100 data-[selected]:text-zinc-900 
    data-[today]:text-amber-400 font-medium`,
    month: "text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-md",
    year: "text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-md",
    weekday:
      "text-zinc-500 font-semibold text-xs uppercase tracking-wide text-center",
  };

  // Convertir el valor de la prop a Date
  const parsedValue = useMemo(() => {
    if (!value) return null;
    if (value instanceof Date) return value;
    const parsed = dayjs(value);
    return parsed.isValid() ? parsed.toDate() : null;
  }, [value]);

  const [localDate, setLocalDate] = useState<Date | null>(parsedValue);

  // Sincronizar el estado local con la prop durante el renderizado
  // (reemplaza el useEffect que causaba el error)
  const isSame = (a: Date | null, b: Date | null) => {
    if (a === b) return true;
    if (a === null || b === null) return false;
    return a.getTime() === b.getTime();
  };

  if (!isSame(parsedValue, localDate)) {
    setLocalDate(parsedValue);
  }

  // Parser de fechas (sin cambios)
  const defaultDateParser = (val: string): Date | null => {
    const clean = val.replace(/\D/g, "");

    if (clean.length === 8) {
      const day = parseInt(clean.substring(0, 2), 10);
      const month = parseInt(clean.substring(2, 4), 10) - 1;
      const year = parseInt(clean.substring(4, 8), 10);
      const date = new Date(year, month, day);
      return date.getFullYear() === year &&
        date.getMonth() === month &&
        date.getDate() === day
        ? date
        : null;
    }

    if (clean.length === 6) {
      const day = parseInt(clean.substring(0, 2), 10);
      const month = parseInt(clean.substring(2, 4), 10) - 1;
      const shortYear = parseInt(clean.substring(4, 6), 10);
      const currentYear = new Date().getFullYear();
      const century = Math.floor(currentYear / 100) * 100;
      const year = century + shortYear;
      const date = new Date(year, month, day);
      return date.getFullYear() === year &&
        date.getMonth() === month &&
        date.getDate() === day
        ? date
        : null;
    }

    const formats = [
      "DD/MM/YYYY",
      "DD-MM-YYYY",
      "YYYY-MM-DD",
      "D/M/YYYY",
      "D-M-YYYY",
    ];
    for (const fmt of formats) {
      const parsed = dayjs(val, fmt, true);
      if (parsed.isValid()) {
        return parsed.toDate();
      }
    }

    return null;
  };

  return (
    <DateInput
      ref={ref}
      locale="es"
      valueFormat="DD/MM/YYYY"
      dateParser={defaultDateParser}
      value={localDate}
      onChange={(val: any) => {
        if (!val) {
          if (!ref.current?.value || ref.current.value.trim() === "") {
            setLocalDate(null);
            onChange(null);
          }
        } else {
          const dateObj = val instanceof Date ? val : dayjs(val).toDate();
          setLocalDate(dateObj);
          onChange(dateObj);
        }
      }}
      label={label}
      placeholder={placeholder || "DD/MM/YYYY o solo números"}
      error={error}
      radius={radius}
      size={size}
      leftSection={<CalendarDaysIcon className="w-5 h-5 text-zinc-500" />}
      previousIcon={<ChevronLeftIcon className="w-4 h-4" />}
      nextIcon={<ChevronRightIcon className="w-4 h-4" />}
      popoverProps={{
        withinPortal: true,
        transitionProps: { transition: "pop", duration: 200 },
        position: "bottom-start",
        offset: 5,
        classNames: {
          dropdown:
            "bg-zinc-900 border border-zinc-800 shadow-2xl rounded-xl p-4",
        },
        ...props.popoverProps,
      }}
      classNames={{
        ...inputStyles,
        ...props.classNames,
      }}
      {...props}
    />
  );
};
