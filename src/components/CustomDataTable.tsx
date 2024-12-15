import React, { useState, useEffect, useCallback } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import "primeicons/primeicons.css";

const CustomDataTable = () => {
  const [tableData, setTableData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(
    new Set()
  );

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
      const newSelectedIds = new Set(selectedProductIds);

      e.value.forEach((item) => {
        newSelectedIds.add(item.id);
      });

      setSelectedProductIds(newSelectedIds);
    },
    [selectedProductIds]
  );

  const clearAllSelections = () => {
    setSelectedProductIds(new Set());
  };

  const selectedProductsForCurrentPage = tableData.filter((item) =>
    selectedProductIds.has(item.id)
  );

  return (
    <div>
      {tableData.length === 0 ? (
        <p>No data available</p>
      ) : (
        <div>
          {selectedProductIds.size > 0 && (
            <div className="mb-3">
              <Button
                label={`Clear All (${selectedProductIds.size})`}
                onClick={clearAllSelections}
                className="p-button-secondary"
              />
            </div>
          )}

          {selectedProductIds.size > 0 && (
            <div className="mt-3">
              Total Selected Items: {selectedProductIds.size}
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
            header="Custom Data Table"
            selectionMode="checkbox"
            selection={selectedProductsForCurrentPage}
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
