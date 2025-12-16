// // import { useState, useRef, useCallback, CSSProperties } from "react";
// // import { Button } from "@/components/ui/button";
// // import { Trash2, Upload, DollarSign } from "lucide-react";
// // import { Badge } from "@/components/ui/badge";
// // import { EditableCell } from "./EditableCell";
// // import { useUpdateDish, useDeleteDish, type Dish } from "@/hooks/useDishes";
// // import { useImageUpload } from "@/hooks/useImageUpload";
// // import { DishOptionsEditor } from "./DishOptionsEditor";
// // import { toast } from "sonner";

// // interface SpreadsheetRowProps {
// //   dish: Dish;
// //   isSelected: boolean;
// //   onSelect: (isSelected: boolean) => void;
// //   style?: CSSProperties;
// // }

// // export const SpreadsheetRow = ({ dish, isSelected, onSelect, style }: SpreadsheetRowProps) => {
// //   const updateDish = useUpdateDish();
// //   const deleteDish = useDeleteDish();
// //   const uploadImage = useImageUpload();
// //   const [localDish, setLocalDish] = useState(dish);
// //   const [isUploadingImage, setIsUploadingImage] = useState(false);
// //   const [showOptionsEditor, setShowOptionsEditor] = useState(false);

// //   // Batched update mechanism
// //   const pendingUpdates = useRef<Partial<Dish>>({});
// //   const updateTimer = useRef<any>(null);

// //   const scheduleUpdate = useCallback((updates: Partial<Dish>) => {
// //     pendingUpdates.current = { ...pendingUpdates.current, ...updates };
    
// //     if (updateTimer.current) {
// //       clearTimeout(updateTimer.current);
// //     }
    
// //     updateTimer.current = setTimeout(() => {
// //       const toUpdate = { ...pendingUpdates.current };
// //       pendingUpdates.current = {};
// //       updateTimer.current = null;
      
// //       updateDish.mutate({
// //         id: dish.id,
// //         updates: toUpdate,
// //       });
// //     }, 200);
// //   }, [dish.id, updateDish]);

// //   const handleUpdate = (field: keyof Dish, value: any, immediate = false) => {
// //     setLocalDish({ ...localDish, [field]: value });
    
// //     if (immediate) {
// //       // Immediate update for toggles - no debounce
// //       updateDish.mutate({ id: dish.id, updates: { [field]: value } });
// //     } else {
// //       scheduleUpdate({ [field]: value });
// //     }
// //   };

// //   const handleDelete = async () => {
// //     if (window.confirm("Delete this dish?")) {
// //       try {
// //         await deleteDish.mutateAsync({ id: dish.id, subcategoryId: dish.subcategory_id });
// //         toast.success("Dish deleted");
// //       } catch (error) {
// //         const message = error instanceof Error ? error.message : "Failed to delete dish";
// //         toast.error(message);
// //       }
// //     }
// //   };

// //   const handleImageClick = () => {
// //     const input = document.createElement("input");
// //     input.type = "file";
// //     input.accept = "image/*";
// //     input.onchange = async (e) => {
// //       const file = (e.target as HTMLInputElement).files?.[0];
// //       if (file) {
// //         setIsUploadingImage(true);
// //         try {
// //           const url = await uploadImage.mutateAsync({
// //             file,
// //             bucket: "dish-images",
// //             path: `${dish.id}/${file.name}`
// //           });
// //           await handleUpdate("image_url", url);
// //           toast.success("Image updated");
// //         } catch (error) {
// //           const message = error instanceof Error ? error.message : "Failed to upload image";
// //           toast.error(message);
// //         } finally {
// //           setIsUploadingImage(false);
// //         }
// //       }
// //     };
// //     input.click();
// //   };

// //   return (
// //     <tr style={style} className="border-b transition-colors hover:bg-muted/30 ">
// //       <td className="sticky left-0 z-[60] bg-background pl-4 pr-2 align-middle w-[40px] border-r border-border will-change-transform" style={{ backgroundColor: 'hsl(var(--background))' }}>
// //         <input
// //           type="checkbox"
// //           checked={isSelected}
// //           onChange={(e) => onSelect(e.target.checked)}
// //           className="cursor-pointer"
// //         />
// //       </td>
// //       <td className="sticky left-[40px] z-[50] bg-background p-4 align-middle w-[100px] border-r border-border will-change-transform" style={{ backgroundColor: 'hsl(var(--background))' }}>
// //         <div
// //           onClick={handleImageClick}
// //           className="w-16 h-16 rounded-lg overflow-hidden cursor-pointer group relative border border-border hover:border-primary transition-colors"
// //         >
// //           {isUploadingImage ? (
// //             <div className="w-full h-full bg-muted animate-pulse flex items-center justify-center">
// //               <Upload className="h-5 w-5 text-muted-foreground animate-bounce" />
// //             </div>
// //           ) : localDish.image_url ? (
// //             <>
// //               <img
// //                 src={localDish.image_url}
// //                 alt={localDish.name}
// //                 className="w-full h-full object-cover"
// //               />
// //               <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
// //                 <Upload className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
// //               </div>
// //             </>
// //           ) : (
// //             <div className="w-full h-full bg-muted flex items-center justify-center">
// //               <Upload className="h-5 w-5 text-muted-foreground" />
// //             </div>
// //           )}
// //         </div>
// //       </td>
// //       <td className="sticky left-[140px] z-[40] bg-background p-4 align-middle w-[220px] border-r-2 border-border shadow-[2px_0_4px_rgba(0,0,0,0.1)] will-change-transform" style={{ backgroundColor: 'hsl(var(--background))' }}>
// //         <EditableCell
// //           type="text"
// //           value={localDish.name}
// //           onSave={(value) => handleUpdate("name", value)}
// //         />
// //       </td>
// //       <td className="p-4 align-middle w-[300px]">
// //         <EditableCell
// //           type="textarea"
// //           value={localDish.description || ""}
// //           onSave={(value) => handleUpdate("description", value)}
// //         />
// //       </td>
// //       <td className="p-4 align-middle w-[100px]">
// //         <EditableCell
// //           type="text"
// //           value={localDish.price}
// //           onSave={(value) => handleUpdate("price", value)}
// //         />
// //       </td>
// //       <td className="p-4 align-middle w-[280px]">
// //         <EditableCell
// //           type="multi-select"
// //           value={localDish.allergens || []}
// //           onSave={(value) => handleUpdate("allergens", value)}
// //           options={["gluten", "dairy", "eggs", "fish", "shellfish", "nuts", "soy", "pork", "beef", "poultry"]}
// //         />
// //       </td>
// //       <td className="p-4 align-middle w-[150px]">
// //         <EditableCell
// //           type="boolean-group"
// //           value={{
// //             vegetarian: localDish.is_vegetarian,
// //             vegan: localDish.is_vegan,
// //             spicy: localDish.is_spicy,
// //           }}
// //           onSave={(value) => {
// //             setLocalDish({
// //               ...localDish,
// //               is_vegetarian: value.vegetarian,
// //               is_vegan: value.vegan,
// //               is_spicy: value.spicy,
// //             });
// //             // Immediate update for toggles
// //             updateDish.mutate({
// //               id: dish.id,
// //               updates: {
// //                 is_vegetarian: value.vegetarian,
// //                 is_vegan: value.vegan,
// //                 is_spicy: value.spicy,
// //               }
// //             });
// //           }}
// //         />
// //       </td>
// //       <td className="p-4 align-middle w-[180px]">
// //         <EditableCell
// //           type="boolean-group"
// //           value={{
// //             new: localDish.is_new,
// //             special: localDish.is_special,
// //             popular: localDish.is_popular,
// //             chef: localDish.is_chef_recommendation,
// //           }}
// //           onSave={(value) => {
// //             setLocalDish({
// //               ...localDish,
// //               is_new: value.new,
// //               is_special: value.special,
// //               is_popular: value.popular,
// //               is_chef_recommendation: value.chef,
// //             });
// //             // Immediate update for toggles
// //             updateDish.mutate({
// //               id: dish.id,
// //               updates: {
// //                 is_new: value.new,
// //                 is_special: value.special,
// //                 is_popular: value.popular,
// //                 is_chef_recommendation: value.chef,
// //               }
// //             });
// //           }}
// //         />
// //       </td>
// //       <td className="p-4 align-middle w-[100px]">
// //         <EditableCell
// //           type="number"
// //           value={localDish.calories?.toString() || ""}
// //           placeholder="0"
// //           onSave={(value) => handleUpdate("calories", value ? parseInt(value as string) : null)}
// //         />
// //       </td>
// //       <td className="p-4 align-middle w-[100px]">
// //         <Button
// //           variant="outline"
// //           size="sm"
// //           onClick={() => setShowOptionsEditor(true)}
// //           className="h-8"
// //         >
// //           <DollarSign className="h-4 w-4 mr-1" />
// //           {dish.has_options && (
// //             <Badge variant="secondary" className="ml-1 text-xs px-1">
// //               ✓
// //             </Badge>
// //           )}
// //         </Button>
// //       </td>
// //       <td className="p-4 align-middle w-[80px]">
// //         <div className="flex items-center gap-1">
// //           <Button variant="ghost" size="sm" onClick={handleDelete} className="h-8 w-8 p-0">
// //             <Trash2 className="h-4 w-4" />
// //           </Button>
// //         </div>
// //       </td>

// //       <DishOptionsEditor
// //         dishId={dish.id}
// //         dishName={dish.name}
// //         hasOptions={dish.has_options}
// //         open={showOptionsEditor}
// //         onOpenChange={setShowOptionsEditor}
// //       />
// //     </tr>
// //   );
// // };





import { useState, useRef, useCallback, CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Upload, DollarSign, Edit, X, Check, MoreVertical, Image as ImageIcon, ChevronRight, FileSpreadsheet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EditableCell } from "./EditableCell";
import { useUpdateDish, useDeleteDish, type Dish } from "@/hooks/useDishes";
import { useImageUpload } from "@/hooks/useImageUpload";
import { DishOptionsEditor } from "./DishOptionsEditor";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface SpreadsheetRowProps {
  dish: Dish;
  isSelected: boolean;
  onSelect: (isSelected: boolean) => void;
  onMobileEdit?: (dishId: string | null) => void;
  isMobileEditing?: boolean;
  renderMobileCard?: boolean;
  style?: CSSProperties;
}

export const SpreadsheetRow = ({ 
  dish, 
  isSelected, 
  onSelect, 
  onMobileEdit,
  isMobileEditing = false,
  renderMobileCard = false,
  style 
}: SpreadsheetRowProps) => {
  const updateDish = useUpdateDish();
  const deleteDish = useDeleteDish();
  const uploadImage = useImageUpload();
  const [localDish, setLocalDish] = useState(dish);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showOptionsEditor, setShowOptionsEditor] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);

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
          handleUpdate("image_url", url, true);
          if (editingDish) {
            setEditingDish({ ...editingDish, image_url: url });
          }
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

  const openMobileEditor = () => {
    setEditingDish({ ...localDish });
    onMobileEdit?.(dish.id);
  };

  const closeMobileEditor = () => {
    onMobileEdit?.(null);
    setEditingDish(null);
  };

  const saveMobileChanges = () => {
    if (editingDish) {
      setLocalDish(editingDish);
      updateDish.mutate({
        id: dish.id,
        updates: {
          name: editingDish.name,
          description: editingDish.description,
          price: editingDish.price,
          calories: editingDish.calories,
          allergens: editingDish.allergens,
          is_vegetarian: editingDish.is_vegetarian,
          is_vegan: editingDish.is_vegan,
          is_spicy: editingDish.is_spicy,
          is_new: editingDish.is_new,
          is_special: editingDish.is_special,
          is_popular: editingDish.is_popular,
          is_chef_recommendation: editingDish.is_chef_recommendation,
        }
      });
      toast.success("Dish updated");
    }
    closeMobileEditor();
  };

  const toggleAllergen = (allergen: string) => {
    if (!editingDish) return;
    const allergens = editingDish.allergens || [];
    const newAllergens = allergens.includes(allergen)
      ? allergens.filter(a => a !== allergen)
      : [...allergens, allergen];
    setEditingDish({ ...editingDish, allergens: newAllergens });
  };

  // Mobile Card View
  if (renderMobileCard) {
    return (
      <>
        <div
          className={`flex items-center gap-3 p-3 transition-colors active:bg-accent ${
            isSelected ? 'bg-primary/5' : ''
          }`}
        >
          {/* Checkbox */}
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(e.target.checked)}
            className="cursor-pointer shrink-0"
            onClick={(e) => e.stopPropagation()}
          />
          
          {/* Image */}
          <div 
            className="w-20 h-20 rounded-lg overflow-hidden bg-muted shrink-0 flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation();
              openMobileEditor();
            }}
          >
            {localDish.image_url ? (
              <img
                src={localDish.image_url}
                alt={localDish.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          
          {/* Content */}
          <div 
            className="flex-1 min-w-0"
            onClick={openMobileEditor}
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-semibold text-sm leading-tight line-clamp-2">
                {localDish.name}
              </h3>
            </div>
            
            {localDish.description && (
              <p className="text-xs text-muted-foreground line-clamp-1 mb-1.5">
                {localDish.description}
              </p>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-1">
                {localDish.is_vegetarian && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                    VEG
                  </span>
                )}
                {localDish.is_vegan && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                    VEGAN
                  </span>
                )}
                {localDish.is_spicy && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
                    🌶️
                  </span>
                )}
                {localDish.is_new && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                    NEW
                  </span>
                )}
                {localDish.is_popular && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                    ⭐
                  </span>
                )}
                {localDish.calories && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
                    {localDish.calories} cal
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-semibold">${localDish.price}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Edit Dialog */}
        <Dialog open={isMobileEditing} onOpenChange={(open) => !open && closeMobileEditor()}>
          <DialogContent className="max-w-[95vw] w-full max-h-[90vh] overflow-hidden flex flex-col p-0">
            <DialogHeader className="px-4 pt-4 pb-3 border-b">
              <DialogTitle>Edit Dish</DialogTitle>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {editingDish && (
                <>
                  {/* Image Upload */}
                  <div className="space-y-2">
                    <Label>Dish Image</Label>
                    <div
                      onClick={handleImageClick}
                      className="w-full h-40 rounded-lg overflow-hidden cursor-pointer group relative border-2 border-dashed border-border hover:border-primary transition-colors"
                    >
                      {isUploadingImage ? (
                        <div className="w-full h-full bg-muted animate-pulse flex flex-col items-center justify-center gap-2">
                          <Upload className="h-8 w-8 text-muted-foreground animate-bounce" />
                          <span className="text-xs text-muted-foreground">Uploading...</span>
                        </div>
                      ) : editingDish.image_url ? (
                        <>
                          <img
                            src={editingDish.image_url}
                            alt={editingDish.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex flex-col items-center justify-center">
                            <ImageIcon className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            <span className="text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity mt-1">Change Image</span>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full bg-muted flex flex-col items-center justify-center gap-2">
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Tap to upload image</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Dish Name *</Label>
                    <Input
                      id="name"
                      value={editingDish.name}
                      onChange={(e) => setEditingDish({ ...editingDish, name: e.target.value })}
                      placeholder="e.g., Margherita Pizza"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={editingDish.description || ""}
                      onChange={(e) => setEditingDish({ ...editingDish, description: e.target.value })}
                      placeholder="Describe your dish..."
                      rows={3}
                    />
                  </div>

                  {/* Price & Calories */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="price">Price *</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          value={editingDish.price}
                          onChange={(e) => setEditingDish({ ...editingDish, price: e.target.value })}
                          className="pl-9"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="calories">Calories</Label>
                      <Input
                        id="calories"
                        type="number"
                        value={editingDish.calories || ""}
                        onChange={(e) => setEditingDish({ ...editingDish, calories: e.target.value ? parseInt(e.target.value) : null })}
                        placeholder="Optional"
                      />
                    </div>
                  </div>

                  {/* Dietary Info */}
                  <div className="space-y-3">
                    <Label>Dietary Information</Label>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                        <span className="text-sm font-medium">Vegetarian</span>
                        <Switch
                          checked={editingDish.is_vegetarian}
                          onCheckedChange={(checked) => setEditingDish({ ...editingDish, is_vegetarian: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                        <span className="text-sm font-medium">Vegan</span>
                        <Switch
                          checked={editingDish.is_vegan}
                          onCheckedChange={(checked) => setEditingDish({ ...editingDish, is_vegan: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                        <span className="text-sm font-medium">Spicy 🌶️</span>
                        <Switch
                          checked={editingDish.is_spicy}
                          onCheckedChange={(checked) => setEditingDish({ ...editingDish, is_spicy: checked })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="space-y-3">
                    <Label>Badges & Labels</Label>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                        <span className="text-sm font-medium">New Item</span>
                        <Switch
                          checked={editingDish.is_new}
                          onCheckedChange={(checked) => setEditingDish({ ...editingDish, is_new: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                        <span className="text-sm font-medium">Popular ⭐</span>
                        <Switch
                          checked={editingDish.is_popular}
                          onCheckedChange={(checked) => setEditingDish({ ...editingDish, is_popular: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                        <span className="text-sm font-medium">Special</span>
                        <Switch
                          checked={editingDish.is_special}
                          onCheckedChange={(checked) => setEditingDish({ ...editingDish, is_special: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                        <span className="text-sm font-medium">Chef's Pick</span>
                        <Switch
                          checked={editingDish.is_chef_recommendation}
                          onCheckedChange={(checked) => setEditingDish({ ...editingDish, is_chef_recommendation: checked })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Allergens */}
                  <div className="space-y-3">
                    <Label>Allergens</Label>
                    <div className="flex flex-wrap gap-2">
                      {["gluten", "dairy", "eggs", "fish", "shellfish", "nuts", "soy", "pork", "beef", "poultry"].map((allergen) => (
                        <Button
                          key={allergen}
                          type="button"
                          variant={(editingDish.allergens || []).includes(allergen) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleAllergen(allergen)}
                          className="capitalize"
                        >
                          {allergen}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Options Button */}
                  <div className="space-y-2">
                    <Label>Additional Options</Label>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => {
                        setShowOptionsEditor(true);
                      }}
                    >
                      <DollarSign className="h-4 w-4" />
                      Configure Pricing Options
                      {dish.has_options && (
                        <Badge variant="secondary" className="ml-auto">
                          ✓ Active
                        </Badge>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>

            <DialogFooter className="px-4 py-3 border-t gap-2 sm:gap-0">
              <Button variant="outline" onClick={closeMobileEditor} className="flex-1 sm:flex-none">
                Cancel
              </Button>
              <Button onClick={saveMobileChanges} className="flex-1 sm:flex-none">
                <Check className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <DishOptionsEditor
          dishId={dish.id}
          dishName={dish.name}
          hasOptions={dish.has_options}
          open={showOptionsEditor}
          onOpenChange={setShowOptionsEditor}
        />
      </>
    );
  }

  // Desktop Table Row
  return (
    <>
      <tr style={style} className="border-b transition-colors hover:bg-muted/30">
        <td className=" bg-background pl-4 pr-2 align-middle w-[40px] border-r border-border will-change-transform" style={{ backgroundColor: 'hsl(var(--background))' }}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(e.target.checked)}
            className="cursor-pointer"
          />
        </td>
        <td className=" bg-background p-4 align-middle w-[100px] border-r border-border will-change-transform" style={{ backgroundColor: 'hsl(var(--background))' }}>
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
        <td className=" bg-background p-4 align-middle w-[220px] border-r-2 border-border shadow-[2px_0_4px_rgba(0,0,0,0.1)] will-change-transform" style={{ backgroundColor: 'hsl(var(--background))' }}>
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
      </tr>

      <DishOptionsEditor
        dishId={dish.id}
        dishName={dish.name}
        hasOptions={dish.has_options}
        open={showOptionsEditor}
        onOpenChange={setShowOptionsEditor}
      />
    </>
  );
};