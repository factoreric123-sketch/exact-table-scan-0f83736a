import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCreateDish } from "@/hooks/useDishes";
import { useCreateCategory, type Category } from "@/hooks/useCategories";
import { useCreateSubcategory, type Subcategory } from "@/hooks/useSubcategories";
import { toast } from "sonner";

interface ExcelImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: any[];
  restaurantId: string;
  categories: Category[];
  subcategories: Subcategory[];
  subcategoryId?: string;
}

export const ExcelImportDialog = ({
  open,
  onOpenChange,
  data,
  restaurantId,
  categories,
  subcategories,
  subcategoryId,
}: ExcelImportDialogProps) => {
  const createDish = useCreateDish();
  const createCategory = useCreateCategory();
  const createSubcategory = useCreateSubcategory();

  const parseBoolean = (value: any): boolean => {
    if (typeof value === "boolean") return value;
    const str = String(value).toLowerCase();
    return str === "yes" || str === "true" || str === "1";
  };

  const parseAllergens = (value: any): string[] => {
    if (!value) return [];
    return String(value)
      .split(",")
      .map((a) => a.trim().toLowerCase())
      .filter(Boolean);
  };

  const handleImport = async () => {
    try {
      let imported = 0;
      const categoryMap = new Map<string, string>(); // name -> id
      const subcategoryMap = new Map<string, string>(); // name -> id
      
      // Initialize with existing categories and subcategories
      categories.forEach(cat => categoryMap.set(cat.name.toLowerCase(), cat.id));
      subcategories.forEach(sub => subcategoryMap.set(sub.name.toLowerCase(), sub.id));
      
      for (const row of data) {
        let targetSubcategoryId = subcategoryId;
        
        // If row has Category and Subcategory columns, use them
        const categoryName = row.Category || row.category;
        const subcategoryName = row.Subcategory || row.subcategory;
        
        if (categoryName && subcategoryName) {
          const categoryKey = String(categoryName).trim().toLowerCase();
          const subcategoryKey = String(subcategoryName).trim().toLowerCase();
          
          // Get or create category
          let categoryId = categoryMap.get(categoryKey);
          if (!categoryId) {
            const newCategory = await createCategory.mutateAsync({
              restaurant_id: restaurantId,
              name: String(categoryName).trim(),
              order_index: categories.length + categoryMap.size,
            });
            categoryId = newCategory.id;
            categoryMap.set(categoryKey, categoryId);
          }
          
          // Get or create subcategory
          let newSubcategoryId = subcategoryMap.get(subcategoryKey);
          if (!newSubcategoryId) {
            const newSubcategory = await createSubcategory.mutateAsync({
              category_id: categoryId,
              name: String(subcategoryName).trim(),
              order_index: subcategories.length + subcategoryMap.size,
            });
            newSubcategoryId = newSubcategory.id;
            subcategoryMap.set(subcategoryKey, newSubcategoryId);
          }
          
          targetSubcategoryId = newSubcategoryId;
        }
        
        if (!targetSubcategoryId) {
          toast.error("No subcategory specified for import");
          return;
        }
        
        const dishData = {
          name: row.Name || row.name || "Unnamed Dish",
          description: row.Description || row.description || "",
          price: row.Price || row.price || "0",
          calories: row.Calories || row.calories ? parseInt(String(row.Calories || row.calories)) : null,
          allergens: parseAllergens(row.Allergens || row.allergens),
          is_vegetarian: parseBoolean(row.Vegetarian || row.vegetarian),
          is_vegan: parseBoolean(row.Vegan || row.vegan),
          is_spicy: parseBoolean(row.Spicy || row.spicy),
          is_new: parseBoolean(row.New || row.new),
          is_special: parseBoolean(row.Special || row.special),
          is_popular: parseBoolean(row.Popular || row.popular),
          is_chef_recommendation: parseBoolean(row["Chef's Pick"] || row.chef),
          subcategory_id: targetSubcategoryId,
          order_index: imported,
        };

        await createDish.mutateAsync(dishData);
        imported++;
      }

      toast.success(`Imported ${imported} dishes successfully`);
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to import dishes");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Preview</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Found {data.length} dishes to import. Review and confirm:
          </p>

          <ScrollArea className="h-[400px] rounded-md border p-4">
            <div className="space-y-4">
              {data.map((row, index) => (
                <div key={index} className="border-b pb-3">
                  <h4 className="font-semibold">{row.Name || row.name}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {row.Description || row.description}
                  </p>
                  <div className="flex gap-2 mt-2 text-xs">
                    <span className="font-mono">{row.Price || row.price}</span>
                    {(row.Vegetarian || row.vegetarian) && (
                      <span className="px-2 py-0.5 bg-green-500/10 text-green-500 rounded">
                        Vegetarian
                      </span>
                    )}
                    {(row.Vegan || row.vegan) && (
                      <span className="px-2 py-0.5 bg-green-500/10 text-green-500 rounded">
                        Vegan
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={createDish.isPending}>
            {createDish.isPending ? "Importing..." : `Import ${data.length} Dishes`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
