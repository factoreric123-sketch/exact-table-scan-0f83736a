// // import { useState, useRef, useCallback } from "react";
// // import { useVirtualizer } from "@tanstack/react-virtual";
// // import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// // import { Button } from "@/components/ui/button";
// // import { Download, Upload, Trash2, Plus } from "lucide-react";
// // import { SpreadsheetRow } from "./SpreadsheetRow";
// // import { ExcelImportDialog } from "./ExcelImportDialog";
// // import { useCreateDish, useDeleteDish, type Dish } from "@/hooks/useDishes";
// // import type { Category } from "@/hooks/useCategories";
// // import type { Subcategory } from "@/hooks/useSubcategories";
// // import * as XLSX from "xlsx";
// // import { toast } from "sonner";

// // interface SpreadsheetViewProps {
// //   dishes: Dish[];
// //   categories: Category[];
// //   subcategories: Subcategory[];
// //   restaurantId: string;
// //   activeSubcategoryId: string;
// // }

// // export const SpreadsheetView = ({
// //   dishes,
// //   categories,
// //   subcategories,
// //   restaurantId,
// //   activeSubcategoryId,
// // }: SpreadsheetViewProps) => {
// //   const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
// //   const [showImportDialog, setShowImportDialog] = useState(false);
// //   const [importData, setImportData] = useState<any[]>([]);
// //   const parentRef = useRef<HTMLDivElement>(null);
// //   const createDish = useCreateDish();
// //   const deleteDish = useDeleteDish();

// //   const rowVirtualizer = useVirtualizer({
// //     count: dishes.length,
// //     getScrollElement: () => parentRef.current,
// //     estimateSize: () => 60,
// //     overscan: 10,
// //   });

// //   const handleExport = useCallback(() => {
// //     try {
// //       // Export ALL dishes with their category and subcategory information
// //       const exportData = dishes.map((dish) => {
// //         const subcategory = subcategories.find((s) => s.id === dish.subcategory_id);
// //         const category = categories.find((c) => c.id === subcategory?.category_id);
        
// //         return {
// //           Category: category?.name || "",
// //           Subcategory: subcategory?.name || "",
// //           Name: dish.name,
// //           Description: dish.description || "",
// //           Price: dish.price,
// //           Calories: dish.calories || "",
// //           Allergens: dish.allergens?.join(", ") || "",
// //           Vegetarian: dish.is_vegetarian ? "Yes" : "No",
// //           Vegan: dish.is_vegan ? "Yes" : "No",
// //           Spicy: dish.is_spicy ? "Yes" : "No",
// //           New: dish.is_new ? "Yes" : "No",
// //           Special: dish.is_special ? "Yes" : "No",
// //           Popular: dish.is_popular ? "Yes" : "No",
// //           "Chef's Pick": dish.is_chef_recommendation ? "Yes" : "No",
// //         };
// //       });

// //       const worksheet = XLSX.utils.json_to_sheet(exportData);
// //       const workbook = XLSX.utils.book_new();
      
// //       XLSX.utils.book_append_sheet(workbook, worksheet, "Full Menu");
// //       XLSX.writeFile(workbook, `menu_full_${Date.now()}.xlsx`);
      
// //       toast.success("Full menu exported successfully");
// //     } catch (error) {
// //       toast.error("Failed to export menu");
// //     }
// //   }, [dishes, subcategories, categories]);

// //   const handleImportClick = () => {
// //     const input = document.createElement("input");
// //     input.type = "file";
// //     input.accept = ".xlsx,.xls,.csv";
// //     input.onchange = (e) => {
// //       const file = (e.target as HTMLInputElement).files?.[0];
// //       if (file) {
// //         const reader = new FileReader();
// //         reader.onload = (event) => {
// //           try {
// //             const data = new Uint8Array(event.target?.result as ArrayBuffer);
// //             const workbook = XLSX.read(data, { type: "array" });
// //             const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
// //             const jsonData = XLSX.utils.sheet_to_json(firstSheet);
// //             setImportData(jsonData);
// //             setShowImportDialog(true);
// //           } catch (error) {
// //             toast.error("Failed to read file");
// //           }
// //         };
// //         reader.readAsArrayBuffer(file);
// //       }
// //     };
// //     input.click();
// //   };

// //   const handleRowSelect = (dishId: string, isSelected: boolean) => {
// //     setSelectedRows((prev) => {
// //       const newSet = new Set(prev);
// //       if (isSelected) {
// //         newSet.add(dishId);
// //       } else {
// //         newSet.delete(dishId);
// //       }
// //       return newSet;
// //     });
// //   };

// //   const handleBulkDelete = async () => {
// //     const dishesToDelete = Array.from(selectedRows);
// //     const deletedDishes = dishes.filter(d => dishesToDelete.includes(d.id));
    
// //     // Optimistically clear selection
// //     setSelectedRows(new Set());
    
// //     // Show undo toast
// //     const toastId = toast.loading(`Deleting ${dishesToDelete.length} dishes...`, {
// //       duration: 5000,
// //       action: {
// //         label: "Undo",
// //         onClick: () => {
// //           toast.dismiss(toastId);
// //           toast.success("Deletion cancelled");
// //           // Restore selection if user clicks undo before deletion completes
// //           setSelectedRows(new Set(dishesToDelete));
// //         },
// //       },
// //     });
    
// //     // Wait 5 seconds before actually deleting
// //     await new Promise(resolve => setTimeout(resolve, 5000));
    
// //     // Check if toast was dismissed (undo clicked)
// //     // If the selection was restored, cancel the deletion
// //     if (selectedRows.size > 0) return;
    
// //     const deletionPromises = dishesToDelete.map(dishId => {
// //       const dish = deletedDishes.find(d => d.id === dishId);
// //       if (!dish) return Promise.resolve();
// //       return deleteDish.mutateAsync({ id: dishId, subcategoryId: dish.subcategory_id });
// //     });
    
// //     try {
// //       await Promise.all(deletionPromises);
// //       toast.dismiss(toastId);
// //       toast.success(`Deleted ${dishesToDelete.length} dishes`);
// //     } catch (error) {
// //       toast.dismiss(toastId);
// //       toast.error("Failed to delete some dishes");
// //     }
// //   };

// //   const handleAddDish = () => {
// //     createDish.mutate({
// //       subcategory_id: activeSubcategoryId,
// //       name: "New Dish",
// //       description: "",
// //       price: "0.00",
// //       order_index: dishes.length,
// //     });
// //   };

// //   return (
// //     <div className="h-full flex flex-col bg-background">
// //       <div className="flex items-center justify-between px-12 py-3 border-b bg-background">
// //         <div className="flex items-center gap-2">
// //           {selectedRows.size > 0 && (
// //             <>
// //               <span className="text-sm font-medium">
// //                 {selectedRows.size} selected
// //               </span>
// //               <Button
// //                 variant="destructive"
// //                 size="sm"
// //                 onClick={handleBulkDelete}
// //                 className="gap-2"
// //               >
// //                 <Trash2 className="h-4 w-4" />
// //                 Delete
// //               </Button>
// //             </>
// //           )}
// //         </div>
// //         <div className="flex items-center gap-2">
// //           <Button variant="outline" size="sm" onClick={handleImportClick} className="gap-2">
// //             <Upload className="h-4 w-4" />
// //             Import
// //           </Button>
// //           <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
// //             <Download className="h-4 w-4" />
// //             Export
// //           </Button>
// //         </div>
// //       </div>

// //       <div
// //         ref={parentRef}
// //         className="flex-1 overflow-x-auto overflow-y-auto bg-background"
// //       >
// //         <table className="min-w-[1580px] w-full caption-bottom text-sm" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
// //           <thead className="sticky top-0 z-20 bg-muted border-b">
// //             <tr className="border-b">
// //               <th className="sticky left-0 z-[60] bg-muted h-12 pl-4 pr-2 text-left align-middle font-semibold text-sm w-[40px] border-r border-border will-change-transform" style={{ backgroundColor: 'hsl(var(--muted))' }}>
// //                 <input
// //                   type="checkbox"
// //                   checked={selectedRows.size === dishes.length && dishes.length > 0}
// //                   onChange={(e) => {
// //                     if (e.target.checked) {
// //                       setSelectedRows(new Set(dishes.map((d) => d.id)));
// //                     } else {
// //                       setSelectedRows(new Set());
// //                     }
// //                   }}
// //                   className="cursor-pointer"
// //                 />
// //               </th>
// //               <th className="sticky left-[40px] z-[50] bg-muted h-12 px-4 text-left align-middle font-semibold text-sm w-[100px] border-r border-border will-change-transform" style={{ backgroundColor: 'hsl(var(--muted))' }}>Image</th>
// //               <th className="sticky left-[140px] z-[40] bg-muted h-12 px-4 text-left align-middle font-semibold text-sm w-[220px] border-r-2 border-border shadow-[2px_0_4px_rgba(0,0,0,0.1)] will-change-transform" style={{ backgroundColor: 'hsl(var(--muted))' }}>Name</th>
// //               <th className="h-12 px-4 text-left align-middle font-semibold text-sm w-[300px]">Description</th>
// //               <th className="h-12 px-4 text-center align-middle font-semibold text-sm w-[100px]">Price</th>
// //               <th className="h-12 px-4 text-left align-middle font-semibold text-sm w-[300px]">Description</th>
// //               <th className="h-12 px-4 text-center align-middle font-semibold text-sm w-[100px]">Price</th>
              
// //               <th className="h-12 px-4 text-center align-middle font-semibold text-sm w-[280px]">Allergens</th>
// //               <th className="h-12 px-4 text-center align-middle font-semibold text-sm w-[150px]">Dietary Info</th>
// //               <th className="h-12 px-4 text-center align-middle font-semibold text-sm w-[180px]">Badges & Labels</th>
// //               <th className="h-12 px-4 text-center align-middle font-semibold text-sm w-[100px]">Calories</th>
// //               <th className="h-12 px-4 text-center align-middle font-semibold text-sm w-[100px]">Options</th>
// //               <th className="h-12 px-4 text-center align-middle font-semibold text-sm w-[100px]">Actions</th>
// //             </tr>
// //           </thead>
// //           <tbody>
// //             {rowVirtualizer.getVirtualItems().map((virtualRow) => {
// //               const dish = dishes[virtualRow.index];
// //               return (
// //                 <SpreadsheetRow
// //                   key={dish.id}
// //                   dish={dish}
// //                   isSelected={selectedRows.has(dish.id)}
// //                   onSelect={(isSelected) => handleRowSelect(dish.id, isSelected)}
// //                   style={{
// //                     height: `${virtualRow.size}px`,
// //                   }}
// //                 />
// //               );
// //             })}
// //           </tbody>
// //         </table>
// //       </div>

// //       {/* Add Dish Button Footer */}
// //       <div className="border-t bg-background px-12 py-3">
// //         <Button
// //           onClick={handleAddDish}
// //           variant="outline"
// //           className="gap-2"
// //           disabled={createDish.isPending}
// //         >
// //           <Plus className="h-4 w-4" />
// //           {createDish.isPending ? "Adding..." : "Add Dish"}
// //         </Button>
// //       </div>

// //       <ExcelImportDialog
// //         open={showImportDialog}
// //         onOpenChange={setShowImportDialog}
// //         data={importData}
// //         restaurantId={restaurantId}
// //         categories={categories}
// //         subcategories={subcategories}
// //         subcategoryId={activeSubcategoryId}
// //       />
// //     </div>
// //   );
// // };



import { useState, useRef, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, Upload, Trash2, Plus, MoreVertical, FileSpreadsheet, Edit, ChevronRight } from "lucide-react";
import { SpreadsheetRow } from "./SpreadsheetRow";
import { ExcelImportDialog } from "./ExcelImportDialog";
import { useCreateDish, useDeleteDish, type Dish } from "@/hooks/useDishes";
import type { Category } from "@/hooks/useCategories";
import type { Subcategory } from "@/hooks/useSubcategories";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const [editingDishId, setEditingDishId] = useState<string | null>(null);
  const parentRef = useRef<HTMLDivElement>(null);
  const createDish = useCreateDish();
  const deleteDish = useDeleteDish();

  const rowVirtualizer = useVirtualizer({
    count: dishes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 10,
  });

  const handleExampleImport = useCallback(() => {
    try {
      const templateData = [
        {
          Category: "Appetizers",
          Subcategory: "Starters",
          Name: "Example Dish",
          Description: "A delicious example dish",
          Price: "12.99",
          Calories: 350,
          Allergens: "gluten, dairy",
          Vegetarian: "No",
          Vegan: "No",
          Spicy: "No",
          New: "Yes",
          Special: "No",
          Popular: "No",
          "Chef's Pick": "No",
        },
        {
          Category: "Main Course",
          Subcategory: "Grilled",
          Name: "Another Example",
          Description: "Another example to show the format",
          Price: "24.99",
          Calories: 600,
          Allergens: "",
          Vegetarian: "Yes",
          Vegan: "No",
          Spicy: "Yes",
          New: "No",
          Special: "Yes",
          Popular: "Yes",
          "Chef's Pick": "Yes",
        },
      ];

      const worksheet = XLSX.utils.json_to_sheet(templateData);
      const workbook = XLSX.utils.book_new();
      
      XLSX.utils.book_append_sheet(workbook, worksheet, "Import Template");
      XLSX.writeFile(workbook, "menu_import_template.xlsx");
      
      toast.success("Example import template downloaded");
    } catch (error) {
      toast.error("Failed to generate template");
    }
  }, []);

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

  const handleBulkDelete = async () => {
    const dishesToDelete = Array.from(selectedRows);
    const deletedDishes = dishes.filter(d => dishesToDelete.includes(d.id));
    
    // Optimistically clear selection
    setSelectedRows(new Set());
    
    // Show undo toast
    const toastId = toast.loading(`Deleting ${dishesToDelete.length} dishes...`, {
      duration: 5000,
      action: {
        label: "Undo",
        onClick: () => {
          toast.dismiss(toastId);
          toast.success("Deletion cancelled");
          // Restore selection if user clicks undo before deletion completes
          setSelectedRows(new Set(dishesToDelete));
        },
      },
    });
    
    // Wait 5 seconds before actually deleting
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check if toast was dismissed (undo clicked)
    // If the selection was restored, cancel the deletion
    if (selectedRows.size > 0) return;
    
    const deletionPromises = dishesToDelete.map(dishId => {
      const dish = deletedDishes.find(d => d.id === dishId);
      if (!dish) return Promise.resolve();
      return deleteDish.mutateAsync({ id: dishId, subcategoryId: dish.subcategory_id });
    });
    
    try {
      await Promise.all(deletionPromises);
      toast.dismiss(toastId);
      toast.success(`Deleted ${dishesToDelete.length} dishes`);
    } catch (error) {
      toast.dismiss(toastId);
      toast.error("Failed to delete some dishes");
    }
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
      {/* Desktop Toolbar */}
      <div className="hidden md:flex items-center justify-between px-4 lg:px-12 py-3 border-b bg-background">
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
          <Button variant="outline" size="sm" onClick={handleExampleImport} className="gap-2">
            <Download className="h-4 w-4" />
            Example Import
          </Button>
        </div>
      </div>

      {/* Mobile Toolbar */}
      <div className="flex md:hidden items-center justify-between px-3 py-2 border-b bg-background">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {selectedRows.size > 0 ? (
            <>
              <span className="text-xs font-medium truncate">
                {selectedRows.size} selected
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                className="h-8 px-2 gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden xs:inline">Delete</span>
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-1.5">
              <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Table View</span>
            </div>
          )}
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 px-2">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px]">
            <DropdownMenuItem onClick={handleImportClick}>
              <Upload className="h-4 w-4 mr-2" />
              Import Excel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExampleImport}>
              <Download className="h-4 w-4 mr-2" />
              Example Import
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Scrollable Table Container */}
      <div
        ref={parentRef}
        className="flex-1 overflow-auto bg-background"
      >
        {/* Desktop Table */}
        <table className="hidden md:table min-w-[1580px] w-full caption-bottom text-sm" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead className="sticky top-0 z-20 bg-muted border-b">
            <tr className="border-b">
              <th className=" bg-muted h-12 pl-4 pr-2 text-left align-middle font-semibold text-sm w-[40px] border-r border-border will-change-transform" style={{ backgroundColor: 'hsl(var(--muted))' }}>
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
              <th className=" bg-muted h-12 px-4 text-left align-middle font-semibold text-sm w-[100px] border-r border-border will-change-transform" style={{ backgroundColor: 'hsl(var(--muted))' }}>Image</th>
              <th className=" bg-muted h-12 px-4 text-left align-middle font-semibold text-sm w-[220px] border-r-2 border-border shadow-[2px_0_4px_rgba(0,0,0,0.1)] will-change-transform" style={{ backgroundColor: 'hsl(var(--muted))' }}>Name</th>
              <th className="h-12 px-4 text-left align-middle font-semibold text-sm w-[300px]">Description</th>
              <th className="h-12 px-4 text-center align-middle font-semibold text-sm w-[100px]">Price</th>
              <th className="h-12 px-4 text-center align-middle font-semibold text-sm w-[280px]">Allergens</th>
              <th className="h-12 px-4 text-center align-middle font-semibold text-sm w-[150px]">Dietary Info</th>
              <th className="h-12 px-4 text-center align-middle font-semibold text-sm w-[180px]">Badges & Labels</th>
              <th className="h-12 px-4 text-center align-middle font-semibold text-sm w-[100px]">Calories</th>
              <th className="h-12 px-4 text-center align-middle font-semibold text-sm w-[100px]">Options</th>
              <th className="h-12 px-4 text-center align-middle font-semibold text-sm w-[100px]">Actions</th>
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
                  onMobileEdit={setEditingDishId}
                  isMobileEditing={editingDishId === dish.id}
                  style={{
                    height: `${virtualRow.size}px`,
                  }}
                />
              );
            })}
          </tbody>
        </table>

        {/* Mobile: List View */}
        <div className="md:hidden">
          {dishes.length === 0 ? (
            <div className="text-center py-12 px-4">
              <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">No dishes yet</p>
              <p className="text-xs text-muted-foreground mt-1">Add your first dish to get started</p>
            </div>
          ) : (
            <div className="divide-y">
              {dishes.map((dish) => (
                <SpreadsheetRow
                  key={dish.id}
                  dish={dish}
                  isSelected={selectedRows.has(dish.id)}
                  onSelect={(isSelected) => handleRowSelect(dish.id, isSelected)}
                  onMobileEdit={setEditingDishId}
                  isMobileEditing={editingDishId === dish.id}
                  renderMobileCard={true}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Dish Footer */}
      <div className="border-t bg-background px-3 md:px-12 py-3">
        <Button
          onClick={handleAddDish}
          variant="outline"
          className="gap-2 w-full md:w-auto"
          size="sm"
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
        restaurantId={restaurantId}
        categories={categories}
        subcategories={subcategories}
        subcategoryId={activeSubcategoryId}
      />
    </div>
  );
};