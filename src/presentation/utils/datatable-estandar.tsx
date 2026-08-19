/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from "react";
import {
  DataTable,
  type DataTableColumn,
  type DataTableColumnGroup,
} from "mantine-datatable";
import clsx from "clsx";
import { v4 as uuidv4 } from "uuid";

// Tipos flexibles: hacen `accessor` e `id` opcionales a nivel de API pública.
// El componente asigna UUIDs automáticamente cuando faltan.
type FlexibleColumn = Omit<DataTableColumn<any>, "accessor"> & {
  accessor?: string;
};
type FlexibleGroup = Omit<DataTableColumnGroup<any>, "id"> & { id?: string };

interface DataTableEstandarProps {
  idAccessor?: string;
  columns: FlexibleColumn[];
  records: any[];
  initialPageSize?: number;
  loading: boolean;
  columnGroups?: FlexibleGroup[];
  renderExpandedRow?: (record: any) => React.ReactNode;
  [key: string]: any;
}

export const DataTableEstandar = ({
  idAccessor,
  columns,
  records,
  initialPageSize = 25,
  loading,
  columnGroups,
  renderExpandedRow,
  ...props
}: DataTableEstandarProps) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [prevRecords, setPrevRecords] = useState(records);

  // Genera un idAccessor estable por instancia si el consumer no lo provee.
  // Útil cuando la tabla es de solo lectura (sin selección/expansión) y el
  // consumer no quiere declarar una prop que no le aporta nada.
  // Caveat: si se usa selección/expansión o row clicks que dependen del id,
  // el consumer DEBE pasar idAccessor apuntando al campo real del record.
  const [generatedIdAccessor] = useState(() => `dt-${uuidv4()}`);
  const finalIdAccessor = idAccessor ?? generatedIdAccessor;

  if (records !== prevRecords) {
    setPrevRecords(records);
    setPage(1);
  }

  const pagedRecords = useMemo(() => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize;
    return records.slice(from, to);
  }, [records, page, pageSize]);

  // Asigna accessor UUID a columnas que no lo tengan (estable por referencia de columns).
  // Las columnas con accessor ausente deben traer `render` propio: la librería no
  // puede mapear el record sin accessor y la celda quedaría vacía.
  const columnsWithAccessors = useMemo(
    () =>
      columns.map((col) =>
        col.accessor ? col : { ...col, accessor: `c-${uuidv4()}` },
      ),
    [columns],
  );

  // Aplica el render del `#` automático sobre las columnas con accessor "index".
  // Separado del memo anterior para que los UUIDs no se regeneren en cada cambio
  // de página.
  const enhancedColumns = useMemo(
    () =>
      columnsWithAccessors.map((col) => {
        if (col.accessor === "index") {
          return {
            ...col,
            render: (_record: any, index: number) => {
              const absoluteIndex = (page - 1) * pageSize + index + 1;
              return col.render
                ? col.render(_record, absoluteIndex - 1)
                : absoluteIndex;
            },
          };
        }
        return col;
      }),
    [columnsWithAccessors, page, pageSize],
  );

  // Asigna id UUID a grupos (recursivo) que no lo tengan, estable por referencia.
  // El id solo se usa como React key del <th>, así que un UUID es válido.
  const enhancedGroups = useMemo(() => {
    if (!columnGroups || columnGroups.length === 0) return undefined;
    const enhance = (g: FlexibleGroup): DataTableColumnGroup<any> => ({
      ...g,
      id: g.id ?? `g-${uuidv4()}`,
      title: (
        <div className="flex items-center justify-center gap-2 px-2 py-1">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-100">
            {g.title}
          </span>
        </div>
      ),
      groups: g.groups?.map(enhance),
    });
    return columnGroups.map(enhance) as DataTableColumnGroup<any>[];
  }, [columnGroups]);

  const { minHeight = 300, ...otherProps } = props;

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden backdrop-blur-sm">
      <DataTable
        columns={enhancedColumns as DataTableColumn<any>[]}
        groups={enhancedGroups as any}
        records={pagedRecords}
        totalRecords={records.length}
        recordsPerPage={pageSize}
        page={page}
        minHeight={minHeight}
        onPageChange={setPage}
        recordsPerPageOptions={[5, 10, 25, 50, 100]}
        onRecordsPerPageChange={setPageSize}
        striped={true}
        highlightOnHover={true}
        fetching={loading}
        idAccessor={finalIdAccessor}
        // Activa bordes verticales cuando hay grupos presentes
        withColumnBorders={Boolean(enhancedGroups)}
        noRecordsText="No se encontraron registros..."
        loadingText="Cargando..."
        paginationText={({ from, to, totalRecords }) =>
          `${from} - ${to} de ${totalRecords}`
        }
        rowExpansion={
          renderExpandedRow
            ? {
                allowMultiple: false,
                content: ({ record }: { record: any }) =>
                  renderExpandedRow(record),
              }
            : undefined
        }
        scrollAreaProps={{
          viewportProps: {
            style: {
              minHeight: minHeight,
              display: "flex",
              flexDirection: "column",
            },
          },
        }}
        classNames={{
          root: "bg-transparent",
          table: clsx(
            "bg-transparent",
            // Aplica el color del borde a todas las celdas cuando hay agrupación
            enhancedGroups && "[&_th]:!border-zinc-800 [&_td]:!border-zinc-800",
          ),
          header: clsx(
            "bg-zinc-900/80",
            enhancedGroups && ["[&_tr:not(:last-child)_th]:!bg-zinc-950"],
          ),
          pagination: "bg-zinc-900/50 border-t border-zinc-800",
        }}
        styles={{
          header: {
            "--mantine-color-text": "var(--mantine-color-zinc-3, #d4d4d8)",
          },
        }}
        {...otherProps}
      />
    </div>
  );
};
