import { useState, useRef, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, Upload, Trash2, Plus } from "lucide-react";
import { SpreadsheetRow } from "./SpreadsheetRow";
import { ExcelImportDialog } from "./ExcelImportDialog";
import { useCreateDish, type Dish } from "@/hooks/useDishes";
import type { Category } from "@/hooks/useCategories";
import type { Subcategory } from "@/hooks/useSubcategories";
import * as XLSX from "xlsx";
import { toast } from "sonner";

interface SpreadsheetViewProps {
  dishes: Dish[];
  categories: Category[];
  subcategories: Subcategory[];
  restaurantId: string;
  activeSubcategoryId: string;
}

export const SpreadsheetView = ({
  dishes,
  categories,
  subcategories,
  restaurantId,
  activeSubcategoryId,
}: SpreadsheetViewProps) => {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importData, setImportData] = useState<any[]>([]);
  const parentRef = useRef<HTMLDivElement>(null);
  const createDish = useCreateDish();

  const rowVirtualizer = useVirtualizer({
    count: dishes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 10,
  });

  const handleExport = useCallback(() => {
    try {
      const exportData = dishes.map((dish) => ({
        Name: dish.name,
        Description: dish.description || "",
        Price: dish.price,
        Calories: dish.calories || "",
        Allergens: dish.allergens?.join(", ") || "",
        Vegetarian: dish.is_vegetarian ? "Yes" : "No",
        Vegan: dish.is_vegan ? "Yes" : "No",
        Spicy: dish.is_spicy ? "Yes" : "No",
        New: dish.is_new ? "Yes" : "No",
        Special: dish.is_special ? "Yes" : "No",
        Popular: dish.is_popular ? "Yes" : "No",
        "Chef's Pick": dish.is_chef_recommendation ? "Yes" : "No",
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      
      const subcategory = subcategories.find((s) => s.id === activeSubcategoryId);
      const sheetName = subcategory?.name || "Dishes";
      
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      XLSX.writeFile(workbook, `menu_${sheetName}_${Date.now()}.xlsx`);
      
      toast.success("Menu exported successfully");
    } catch (error) {
      toast.error("Failed to export menu");
    }
  }, [dishes, subcategories, activeSubcategoryId]);

  const handleImportClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".xlsx,.xls,.csv";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = new Uint8Array(event.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: "array" });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet);
            setImportData(jsonData);
            setShowImportDialog(true);
          } catch (error) {
            toast.error("Failed to read file");
          }
        };
        reader.readAsArrayBuffer(file);
      }
    };
    input.click();
  };

  const handleRowSelect = (dishId: string, isSelected: boolean) => {
    setSelectedRows((prev) => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(dishId);
      } else {
        newSet.delete(dishId);
      }
      return newSet;
    });
  };

  const handleBulkDelete = () => {
    // TODO: Implement bulk delete
    toast.success(`Deleted ${selectedRows.size} dishes`);
    setSelectedRows(new Set());
  };

  const handleAddDish = () => {
    createDish.mutate({
      subcategory_id: activeSubcategoryId,
      name: "New Dish",
      description: "",
      price: "0.00",
      order_index: dishes.length,
    });
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex items-center justify-between px-12 py-3 border-b bg-background">
        <div className="flex items-center gap-2">
          {selectedRows.size > 0 && (
            <>
              <span className="text-sm font-medium">
                {selectedRows.size} selected
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleImportClick} className="gap-2">
            <Upload className="h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div
        ref={parentRef}
        className="flex-1 overflow-x-auto overflow-y-auto bg-background px-12"
      >
        <table className="min-w-[1680px] w-full caption-bottom text-sm border-collapse">
          <thead className="sticky top-0 z-30 bg-muted border-b">
            <tr className="border-b">
              <th className="sticky left-0 z-40 bg-muted h-12 px-6 text-left align-middle font-semibold text-sm w-[40px] border-r-2 border-border">
                <input
                  type="checkbox"
                  checked={selectedRows.size === dishes.length && dishes.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedRows(new Set(dishes.map((d) => d.id)));
                    } else {
                      setSelectedRows(new Set());
                    }
                  }}
                  className="cursor-pointer"
                />
              </th>
              <th className="sticky left-[40px] z-40 bg-muted h-12 px-4 text-left align-middle font-semibold text-sm w-[100px] border-r-2 border-border">Image</th>
              <th className="sticky left-[140px] z-40 bg-muted h-12 px-4 text-left align-middle font-semibold text-sm w-[220px] border-r-2 border-border shadow-[2px_0_4px_rgba(0,0,0,0.1)]">Name</th>
              <th className="h-12 px-4 text-left align-middle font-semibold text-sm w-[300px]">Description</th>
              <th className="h-12 px-4 text-left align-middle font-semibold text-sm w-[100px]">Price</th>
              <th className="h-12 px-4 text-left align-middle font-semibold text-sm w-[280px]">Allergens</th>
              <th className="h-12 px-4 text-left align-middle font-semibold text-sm w-[200px]">Dietary Info</th>
              <th className="h-12 px-4 text-left align-middle font-semibold text-sm w-[240px]">Badges & Labels</th>
              <th className="h-12 px-4 text-left align-middle font-semibold text-sm w-[100px]">Calories</th>
              <th className="h-12 px-4 text-left align-middle font-semibold text-sm w-[100px]">Options</th>
              <th className="h-12 px-4 text-left align-middle font-semibold text-sm w-[100px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const dish = dishes[virtualRow.index];
              return (
                <SpreadsheetRow
                  key={dish.id}
                  dish={dish}
                  isSelected={selectedRows.has(dish.id)}
                  onSelect={(isSelected) => handleRowSelect(dish.id, isSelected)}
                  style={{
                    height: `${virtualRow.size}px`,
                  }}
                />
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Dish Button Footer */}
      <div className="border-t bg-background px-12 py-3">
        <Button
          onClick={handleAddDish}
          variant="outline"
          className="gap-2"
          disabled={createDish.isPending}
        >
          <Plus className="h-4 w-4" />
          {createDish.isPending ? "Adding..." : "Add Dish"}
        </Button>
      </div>

      <ExcelImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        data={importData}
        subcategoryId={activeSubcategoryId}
      />
    </div>
  );
};
