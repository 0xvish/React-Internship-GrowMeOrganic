import React, { useState, useEffect, useCallback, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { OverlayPanel } from "primereact/overlaypanel";
import { InputNumber } from "primereact/inputnumber";
import "primeicons/primeicons.css";

const CustomDataTable = () => {
  const [tableData, setTableData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedProducts, setSelectedProducts] = useState<{
    ids: Set<string>;
    items: any[];
  }>({
    ids: new Set(),
    items: [],
  });

  const overlayPanelRef = useRef<OverlayPanel>(null);
  const [rowsToSelect, setRowsToSelect] = useState<number>(1);

  const fetchTableData = async (page: number) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.artic.edu/api/v1/artworks?page=${page}`
      );
      const data = await response.json();
      if (data.data && data.data.length > 0) {
        setTableData(data.data);
        setTotalRecords(data.pagination.total);
      } else {
        console.error("No data received from API.");
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTableData(currentPage);
  }, [currentPage]);

  const onSelectionChange = useCallback(
    (e) => {
      const newSelectedProducts = {
        ids: new Set(selectedProducts.ids),
        items: [...selectedProducts.items],
      };

      e.value.forEach((item) => {
        if (!newSelectedProducts.ids.has(item.id)) {
          newSelectedProducts.ids.add(item.id);
          newSelectedProducts.items.push(item);
        }
      });

      setSelectedProducts(newSelectedProducts);
    },
    [selectedProducts]
  );

  const clearAllSelections = () => {
    setSelectedProducts({
      ids: new Set(),
      items: [],
    });
  };

  const selectRowsByCount = async () => {
    const safeRowsToSelect = Math.min(Math.max(1, rowsToSelect), totalRecords);

    const newSelectedProducts = {
      ids: new Set(selectedProducts.ids),
      items: [...selectedProducts.items],
    };

    let rowsSelected = 0;

    let currentPageToFetch = currentPage;

    while (rowsSelected < safeRowsToSelect) {
      try {
        const response = await fetch(
          `https://api.artic.edu/api/v1/artworks?page=${currentPageToFetch}`
        );
        const data = await response.json();

        if (data.data && data.data.length > 0) {
          const remainingRowsToSelect = safeRowsToSelect - rowsSelected;
          const rowsToTakeFromThisPage = Math.min(
            remainingRowsToSelect,
            data.data.length
          );

          for (let i = 0; i < rowsToTakeFromThisPage; i++) {
            const item = data.data[i];
            if (!newSelectedProducts.ids.has(item.id)) {
              newSelectedProducts.ids.add(item.id);
              newSelectedProducts.items.push(item);
              rowsSelected++;
            }
          }
        }

        currentPageToFetch++;

        if (
          rowsSelected >= safeRowsToSelect ||
          currentPageToFetch > Math.ceil(totalRecords / 12)
        ) {
          break;
        }
      } catch (error) {
        console.error(`Error fetching page ${currentPageToFetch}:`, error);
        break;
      }
    }

    setSelectedProducts(newSelectedProducts);

    if (overlayPanelRef.current) {
      overlayPanelRef.current.hide();
    }
  };

  const selectRowsButtonRef = useRef(null);

  return (
    <div>
      {tableData.length === 0 ? (
        <p>No data available</p>
      ) : (
        <div>
          <div className="flex gap-2 mb-3">
            {selectedProducts.ids.size > 0 && (
              <Button
                label={`Clear All (${selectedProducts.ids.size})`}
                onClick={clearAllSelections}
                className="p-button-secondary"
              />
            )}
          </div>

          <OverlayPanel ref={overlayPanelRef}>
            <div className="flex flex-col gap-2 p-3">
              <label htmlFor="rows-to-select">Number of Rows to Select</label>
              <InputNumber
                inputId="rows-to-select"
                value={rowsToSelect}
                onValueChange={(e) => setRowsToSelect(e.value || 1)}
                min={1}
                max={totalRecords}
              />
              <Button
                label="Select"
                onClick={selectRowsByCount}
                className="p-button-primary"
              />
            </div>
          </OverlayPanel>

          {selectedProducts.ids.size > 0 && (
            <div className="mt-3">
              Total Selected Items: {selectedProducts.ids.size}
            </div>
          )}

          <DataTable
            value={tableData}
            paginator
            rows={12}
            totalRecords={totalRecords}
            lazy
            first={(currentPage - 1) * 12}
            onPage={(e) => setCurrentPage(e.page + 1)}
            loading={loading}
            header={
              <i
                className="pi pi-chevron-down"
                ref={selectRowsButtonRef}
                onClick={(e) => {
                  if (overlayPanelRef.current) {
                    overlayPanelRef.current.toggle(e);
                  }
                }}
              />
            }
            selectionMode="checkbox"
            selection={tableData.filter((item) =>
              selectedProducts.ids.has(item.id)
            )}
            onSelectionChange={onSelectionChange}
            dataKey="id"
            tableStyle={{ minWidth: "50rem" }}
          >
            <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
            <Column field="id" header="ID" />
            <Column field="title" header="Title" />
            <Column field="place_of_origin" header="Place of Origin" />
            <Column field="artist_display" header="Artist" />
            <Column field="inscriptions" header="Inscriptions" />
            <Column field="date_start" header="Date Start" />
            <Column field="date_end" header="Date End" />
          </DataTable>
        </div>
      )}
    </div>
  );
};

export default CustomDataTable;
