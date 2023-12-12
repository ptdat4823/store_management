import {
  ColumnDef,
  ColumnFiltersState,
  RowSelectionState,
  SortingState,
  Table as ReactTable,
  VisibilityState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  TableMeta,
} from "@tanstack/react-table";
import React, { RefObject, useRef, useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { DataTableViewOptions } from "../ui/my_table_column_visibility_toggle";
import CustomDataTableContent from "./custom_datatable_content";
import { TabProps } from "./custom_datatable_row";
import LoadingCircle from "../ui/loading_circle";
export type DatatableConfig<TData> = {
  showExportButton?: boolean;
  showDefaultSearchInput?: boolean;
  alternativeSearchInput?: JSX.Element;
  onDeleteRowsBtnClick?: (dataToDelete: TData[]) => Promise<any>; // if null, remove button
  defaultVisibilityState?: {
    [key: string]: boolean;
  };
};

export type CustomDatatableProps<TData> = {
  data: TData[];
  columns: ColumnDef<TData>[];
  columnTitles: {
    [key: string]: string;
  };
  infoTabs?: TabProps<TData>[];
  buttons?: JSX.Element[];
  config?: DatatableConfig<TData>;
  meta?: TableMeta<TData>;
};

const defaultConfig: DatatableConfig<any> = {
  showExportButton: true,
  showDefaultSearchInput: true,
  alternativeSearchInput: undefined,
  defaultVisibilityState: {},
  onDeleteRowsBtnClick: undefined,
};

export function CustomDatatable<TData>({
  data,
  columns,
  columnTitles,
  infoTabs,
  buttons,
  config,
  meta
}: CustomDatatableProps<TData>) {
  config = { ...defaultConfig, ...config };

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    config?.defaultVisibilityState ?? {}
  );
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [filterInput, setFilterInput] = useState("");

  const table = useReactTable<TData>({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setFilterInput,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter: filterInput,
    },
    meta: meta,
  });

  const [isDeletingCodes, setIsDeletingCodes] = useState(false);

  return (
    <div ref={tableContainerRef} className="w-full space-y-2">
      <div className="flex py-4 flex-col gap-2 md:flex-row md:gap-0 md:items-center md:justify-between">
        {!config.showDefaultSearchInput ||
        config.alternativeSearchInput ? null : (
          <Input
            placeholder="Search anything..."
            value={filterInput}
            onChange={(event) => setFilterInput(event.target.value)}
            className="max-w-sm"
          />
        )}
        {config.alternativeSearchInput}
        <div className="flex flex-row gap-1">
          {config.onDeleteRowsBtnClick !== undefined &&
          table.getSelectedRowModel().rows.length > 0 ? (
            <Button
              variant={"red"}
              disabled={isDeletingCodes}
              onClick={() => {
                setIsDeletingCodes(true);
                config!.onDeleteRowsBtnClick!(
                  table.getSelectedRowModel().rows.map((row) => row.original)
                )
                  .then(() => table.toggleAllRowsSelected(false))
                  .finally(() => setIsDeletingCodes(false));
              }}
            >
              Delete{isDeletingCodes ? <LoadingCircle /> : null}
            </Button>
          ) : null}
          {buttons}
          {!config ||
          config.showExportButton === undefined ||
          config.showExportButton ? (
            <Button variant={"blue"} onClick={() => {}}>
              Export Excel
            </Button>
          ) : null}
          <DataTableViewOptions
            title="Columns"
            table={table}
            columnHeaders={columnTitles}
          />
        </div>
      </div>
      <CustomDataTableContent
        columns={columns}
        table={table}
        tableContainerRef={tableContainerRef}
        infoTabs={infoTabs}
      />
    </div>
  );
}
