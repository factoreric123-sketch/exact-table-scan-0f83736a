import { useState, useRef, useCallback, CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Upload, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EditableCell } from "./EditableCell";
import { useUpdateDish, useDeleteDish, type Dish } from "@/hooks/useDishes";
import { useImageUpload } from "@/hooks/useImageUpload";
import { DishOptionsEditor } from "./DishOptionsEditor";
import { toast } from "sonner";

interface SpreadsheetRowProps {
  dish: Dish;
  isSelected: boolean;
  onSelect: (isSelected: boolean) => void;
  style?: CSSProperties;
}

export const SpreadsheetRow = ({ dish, isSelected, onSelect, style }: SpreadsheetRowProps) => {
  const updateDish = useUpdateDish();
  const deleteDish = useDeleteDish();
  const uploadImage = useImageUpload();
  const [localDish, setLocalDish] = useState(dish);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showOptionsEditor, setShowOptionsEditor] = useState(false);

  // Batched update mechanism
  const pendingUpdates = useRef<Partial<Dish>>({});
  const updateTimer = useRef<any>(null);

  const scheduleUpdate = useCallback((updates: Partial<Dish>) => {
    pendingUpdates.current = { ...pendingUpdates.current, ...updates };
    
    if (updateTimer.current) {
      clearTimeout(updateTimer.current);
    }
    
    updateTimer.current = setTimeout(() => {
      const toUpdate = { ...pendingUpdates.current };
      pendingUpdates.current = {};
      updateTimer.current = null;
      
      updateDish.mutate({
        id: dish.id,
        updates: toUpdate,
      });
    }, 200);
  }, [dish.id, updateDish]);

  const handleUpdate = (field: keyof Dish, value: any, immediate = false) => {
    setLocalDish({ ...localDish, [field]: value });
    
    if (immediate) {
      // Immediate update for toggles - no debounce
      updateDish.mutate({ id: dish.id, updates: { [field]: value } });
    } else {
      scheduleUpdate({ [field]: value });
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Delete this dish?")) {
      try {
        await deleteDish.mutateAsync({ id: dish.id, subcategoryId: dish.subcategory_id });
        toast.success("Dish deleted");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to delete dish";
        toast.error(message);
      }
    }
  };

  const handleImageClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setIsUploadingImage(true);
        try {
          const url = await uploadImage.mutateAsync({
            file,
            bucket: "dish-images",
            path: `${dish.id}/${file.name}`
          });
          await handleUpdate("image_url", url);
          toast.success("Image updated");
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to upload image";
          toast.error(message);
        } finally {
          setIsUploadingImage(false);
        }
      }
    };
    input.click();
  };

  return (
    <tr style={style} className="border-b transition-colors hover:bg-muted/30">
      <td className="sticky left-0 z-[60] bg-background pl-4 pr-2 align-middle w-[40px] border-r border-border will-change-transform" style={{ backgroundColor: 'hsl(var(--background))' }}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(e.target.checked)}
          className="cursor-pointer"
        />
      </td>
      <td className="sticky left-[40px] z-[50] bg-background p-4 align-middle w-[100px] border-r border-border will-change-transform" style={{ backgroundColor: 'hsl(var(--background))' }}>
        <div
          onClick={handleImageClick}
          className="w-16 h-16 rounded-lg overflow-hidden cursor-pointer group relative border border-border hover:border-primary transition-colors"
        >
          {isUploadingImage ? (
            <div className="w-full h-full bg-muted animate-pulse flex items-center justify-center">
              <Upload className="h-5 w-5 text-muted-foreground animate-bounce" />
            </div>
          ) : localDish.image_url ? (
            <>
              <img
                src={localDish.image_url}
                alt={localDish.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <Upload className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </>
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <Upload className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
        </div>
      </td>
      <td className="sticky left-[140px] z-[40] bg-background p-4 align-middle w-[220px] border-r-2 border-border shadow-[2px_0_4px_rgba(0,0,0,0.1)] will-change-transform" style={{ backgroundColor: 'hsl(var(--background))' }}>
        <EditableCell
          type="text"
          value={localDish.name}
          onSave={(value) => handleUpdate("name", value)}
        />
      </td>
      <td className="p-4 align-middle w-[300px]">
        <EditableCell
          type="textarea"
          value={localDish.description || ""}
          onSave={(value) => handleUpdate("description", value)}
        />
      </td>
      <td className="p-4 align-middle w-[100px]">
        <EditableCell
          type="text"
          value={localDish.price}
          onSave={(value) => handleUpdate("price", value)}
        />
      </td>
      <td className="p-4 align-middle w-[280px]">
        <EditableCell
          type="multi-select"
          value={localDish.allergens || []}
          onSave={(value) => handleUpdate("allergens", value)}
          options={["gluten", "dairy", "eggs", "fish", "shellfish", "nuts", "soy", "pork", "beef", "poultry"]}
        />
      </td>
      <td className="p-4 align-middle w-[150px]">
        <EditableCell
          type="boolean-group"
          value={{
            vegetarian: localDish.is_vegetarian,
            vegan: localDish.is_vegan,
            spicy: localDish.is_spicy,
          }}
          onSave={(value) => {
            setLocalDish({
              ...localDish,
              is_vegetarian: value.vegetarian,
              is_vegan: value.vegan,
              is_spicy: value.spicy,
            });
            // Immediate update for toggles
            updateDish.mutate({
              id: dish.id,
              updates: {
                is_vegetarian: value.vegetarian,
                is_vegan: value.vegan,
                is_spicy: value.spicy,
              }
            });
          }}
        />
      </td>
      <td className="p-4 align-middle w-[180px]">
        <EditableCell
          type="boolean-group"
          value={{
            new: localDish.is_new,
            special: localDish.is_special,
            popular: localDish.is_popular,
            chef: localDish.is_chef_recommendation,
          }}
          onSave={(value) => {
            setLocalDish({
              ...localDish,
              is_new: value.new,
              is_special: value.special,
              is_popular: value.popular,
              is_chef_recommendation: value.chef,
            });
            // Immediate update for toggles
            updateDish.mutate({
              id: dish.id,
              updates: {
                is_new: value.new,
                is_special: value.special,
                is_popular: value.popular,
                is_chef_recommendation: value.chef,
              }
            });
          }}
        />
      </td>
      <td className="p-4 align-middle w-[100px]">
        <EditableCell
          type="number"
          value={localDish.calories?.toString() || ""}
          placeholder="0"
          onSave={(value) => handleUpdate("calories", value ? parseInt(value as string) : null)}
        />
      </td>
      <td className="p-4 align-middle w-[100px]">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowOptionsEditor(true)}
          className="h-8"
        >
          <DollarSign className="h-4 w-4 mr-1" />
          {dish.has_options && (
            <Badge variant="secondary" className="ml-1 text-xs px-1">
              ✓
            </Badge>
          )}
        </Button>
      </td>
      <td className="p-4 align-middle w-[80px]">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={handleDelete} className="h-8 w-8 p-0">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>

      <DishOptionsEditor
        dishId={dish.id}
        dishName={dish.name}
        hasOptions={dish.has_options}
        open={showOptionsEditor}
        onOpenChange={setShowOptionsEditor}
      />
    </tr>
  );
};
