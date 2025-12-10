import { memo, useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Plus, GripVertical, X, Check, Loader2, Upload, 
  Flame, Sparkles, Star, TrendingUp, ChefHat, Salad, Sprout 
} from "lucide-react";
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useUpdateDish, type Dish } from "@/hooks/useDishes";
import { useDishOptions } from "@/hooks/useDishOptions";
import { useDishModifiers } from "@/hooks/useDishModifiers";
import { useImageUpload } from "@/hooks/useImageUpload";
import { ImageCropModal } from "@/components/ImageCropModal";
import { ALLERGEN_OPTIONS } from "@/components/AllergenFilter";
import { 
  useCreateDishOptionSilent, 
  useUpdateDishOptionSilent, 
  useDeleteDishOptionSilent,
  useCreateDishModifierSilent,
  useUpdateDishModifierSilent,
  useDeleteDishModifierSilent,
  applyOptimisticOptionsUpdate,
  executeBackgroundMutations,
  normalizePrice,
  type MutationTask
} from "@/hooks/useDishOptionsMutations";
import { useQueryClient } from "@tanstack/react-query";
import { generateTempId } from "@/lib/utils/uuid";
import { toast } from "sonner";
import type { DishOption } from "@/hooks/useDishOptions";
import type { DishModifier } from "@/hooks/useDishModifiers";

interface UnifiedDishEditorProps {
  dish: Dish;
  restaurantId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface EditableDishOption extends DishOption {
  _status?: "new" | "updated" | "deleted" | "unchanged";
  _temp?: boolean;
  _originalOrderIndex?: number;
}

interface EditableDishModifier extends DishModifier {
  _status?: "new" | "updated" | "deleted" | "unchanged";
  _temp?: boolean;
  _originalOrderIndex?: number;
}

// Sortable Item Component
const SortableItem = memo(({ id, name, price, onUpdate, onDelete, type }: {
  id: string;
  name: string;
  price: string;
  onUpdate: (id: string, field: "name" | "price", value: string) => void;
  onDelete: (id: string) => void;
  type: "option" | "modifier";
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg group hover:bg-muted/70"
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 touch-none">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      
      <Input
        type="text"
        placeholder={type === "option" ? "e.g., Small" : "e.g., Extra Cheese"}
        value={name}
        onChange={(e) => onUpdate(id, "name", e.target.value)}
        className="flex-1 h-8 text-sm"
        autoFocus={id.startsWith("temp_")}
      />
      
      <div className="flex items-center gap-1 w-24">
        <span className="text-sm text-muted-foreground">$</span>
        <Input
          type="text"
          placeholder="0.00"
          value={price.replace("$", "")}
          onChange={(e) => {
            const filtered = e.target.value.replace(/[^0-9.]/g, "");
            const parts = filtered.split(".");
            const cleaned = parts[0] + (parts.length > 1 ? "." + parts[1] : "");
            onUpdate(id, "price", cleaned);
          }}
          onBlur={(e) => {
            const normalized = normalizePrice(e.target.value);
            if (normalized !== e.target.value) {
              onUpdate(id, "price", normalized);
            }
          }}
          className="flex-1 h-8 text-sm"
        />
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDelete(id)}
        className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}, (prev, next) => 
  prev.id === next.id && prev.name === next.name && prev.price === next.price && prev.type === next.type
);

SortableItem.displayName = "SortableItem";

// Diff functions
const diffOptions = (initial: EditableDishOption[], current: EditableDishOption[]) => {
  const currentMap = new Map(current.map(o => [o.id, o]));
  const toCreate: EditableDishOption[] = [];
  const toUpdate: EditableDishOption[] = [];
  const toDelete: EditableDishOption[] = [];

  for (const opt of current) {
    if (opt._status === "new") toCreate.push(opt);
    else if (opt._status === "updated") toUpdate.push(opt);
  }

  for (const orig of initial) {
    if (!currentMap.has(orig.id) || currentMap.get(orig.id)?._status === "deleted") {
      toDelete.push(orig);
    }
  }

  return { toCreate, toUpdate, toDelete };
};

const diffModifiers = (initial: EditableDishModifier[], current: EditableDishModifier[]) => {
  const currentMap = new Map(current.map(m => [m.id, m]));
  const toCreate: EditableDishModifier[] = [];
  const toUpdate: EditableDishModifier[] = [];
  const toDelete: EditableDishModifier[] = [];

  for (const mod of current) {
    if (mod._status === "new") toCreate.push(mod);
    else if (mod._status === "updated") toUpdate.push(mod);
  }

  for (const orig of initial) {
    if (!currentMap.has(orig.id) || currentMap.get(orig.id)?._status === "deleted") {
      toDelete.push(orig);
    }
  }

  return { toCreate, toUpdate, toDelete };
};

const normalizeOrderIndexes = <T extends { order_index: number }>(items: T[]): T[] => 
  items.map((item, idx) => ({ ...item, order_index: idx }));

export function UnifiedDishEditor({
  dish,
  restaurantId,
  open,
  onOpenChange,
}: UnifiedDishEditorProps) {
  const queryClient = useQueryClient();
  const { data: options = [], isLoading: optionsLoading, isError: optionsError } = useDishOptions(dish.id);
  const { data: modifiers = [], isLoading: modifiersLoading, isError: modifiersError } = useDishModifiers(dish.id);
  const updateDish = useUpdateDish();
  const uploadImage = useImageUpload();

  // Loading timeout protection
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);
  const isLoading = (optionsLoading || modifiersLoading) && !loadingTimedOut;
  const hasError = optionsError || modifiersError || loadingTimedOut;

  useEffect(() => {
    if (open && (optionsLoading || modifiersLoading)) {
      setLoadingTimedOut(false);
      const timer = setTimeout(() => setLoadingTimedOut(true), 2000);
      return () => clearTimeout(timer);
    }
    if (!open) setLoadingTimedOut(false);
  }, [open, optionsLoading, modifiersLoading]);

  // Mutation hooks
  const createOption = useCreateDishOptionSilent();
  const updateOption = useUpdateDishOptionSilent();
  const deleteOption = useDeleteDishOptionSilent();
  const createModifier = useCreateDishModifierSilent();
  const updateModifier = useUpdateDishModifierSilent();
  const deleteModifier = useDeleteDishModifierSilent();

  // Local dish state
  const [localName, setLocalName] = useState(dish.name);
  const [localDescription, setLocalDescription] = useState(dish.description || "");
  const [localPrice, setLocalPrice] = useState(dish.price);
  const [localCalories, setLocalCalories] = useState(dish.calories?.toString() || "");
  const [localImageUrl, setLocalImageUrl] = useState(dish.image_url || "");
  const [localAllergens, setLocalAllergens] = useState<string[]>(dish.allergens || []);
  const [localVegetarian, setLocalVegetarian] = useState(dish.is_vegetarian ?? false);
  const [localVegan, setLocalVegan] = useState(dish.is_vegan ?? false);
  const [localSpicy, setLocalSpicy] = useState(dish.is_spicy ?? false);
  const [localNew, setLocalNew] = useState(dish.is_new ?? false);
  const [localSpecial, setLocalSpecial] = useState(dish.is_special ?? false);
  const [localPopular, setLocalPopular] = useState(dish.is_popular ?? false);
  const [localChefRec, setLocalChefRec] = useState(dish.is_chef_recommendation ?? false);
  const [localHasOptions, setLocalHasOptions] = useState(dish.has_options ?? false);

  // Options & Modifiers state
  const [localOptions, setLocalOptions] = useState<EditableDishOption[]>([]);
  const [localModifiers, setLocalModifiers] = useState<EditableDishModifier[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  // Image upload state
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const initialOptionsRef = useRef<EditableDishOption[]>([]);
  const initialModifiersRef = useRef<EditableDishModifier[]>([]);
  const saveInProgressRef = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const visibleOptions = useMemo(
    () => localOptions.filter(o => o._status !== "deleted"),
    [localOptions]
  );

  const visibleModifiers = useMemo(
    () => localModifiers.filter(m => m._status !== "deleted"),
    [localModifiers]
  );

  // Initialize state when dialog opens
  useEffect(() => {
    if (open) {
      setLocalName(dish.name);
      setLocalDescription(dish.description || "");
      setLocalPrice(dish.price);
      setLocalCalories(dish.calories?.toString() || "");
      setLocalImageUrl(dish.image_url || "");
      setLocalAllergens(dish.allergens || []);
      setLocalVegetarian(dish.is_vegetarian ?? false);
      setLocalVegan(dish.is_vegan ?? false);
      setLocalSpicy(dish.is_spicy ?? false);
      setLocalNew(dish.is_new ?? false);
      setLocalSpecial(dish.is_special ?? false);
      setLocalPopular(dish.is_popular ?? false);
      setLocalChefRec(dish.is_chef_recommendation ?? false);
      setLocalHasOptions(dish.has_options ?? false);

      const editableOptions: EditableDishOption[] = options.map(opt => ({
        ...opt,
        _status: "unchanged" as const,
        _originalOrderIndex: opt.order_index,
      }));
      const editableModifiers: EditableDishModifier[] = modifiers.map(mod => ({
        ...mod,
        _status: "unchanged" as const,
        _originalOrderIndex: mod.order_index,
      }));

      setLocalOptions(editableOptions);
      setLocalModifiers(editableModifiers);
      setIsDirty(false);

      initialOptionsRef.current = editableOptions.map(o => ({ ...o }));
      initialModifiersRef.current = editableModifiers.map(m => ({ ...m }));
    }
  }, [open, dish, options, modifiers]);

  // Handlers
  const handleAllergenToggle = (allergen: string) => {
    setLocalAllergens(prev => 
      prev.includes(allergen) 
        ? prev.filter(a => a !== allergen) 
        : [...prev, allergen]
    );
    setIsDirty(true);
  };

  const handleAddOption = useCallback(() => {
    setLocalOptions(prev => [...prev, {
      id: generateTempId(),
      dish_id: dish.id,
      name: "",
      price: "0.00",
      order_index: prev.length,
      created_at: new Date().toISOString(),
      _status: "new",
      _temp: true,
    }]);
    setIsDirty(true);
  }, [dish.id]);

  const handleAddModifier = useCallback(() => {
    setLocalModifiers(prev => [...prev, {
      id: generateTempId(),
      dish_id: dish.id,
      name: "",
      price: "0.00",
      order_index: prev.length,
      created_at: new Date().toISOString(),
      _status: "new",
      _temp: true,
    }]);
    setIsDirty(true);
  }, [dish.id]);

  const handleUpdateOption = useCallback((id: string, field: "name" | "price", value: string) => {
    setLocalOptions(prev => prev.map(opt => {
      if (opt.id !== id) return opt;
      return { 
        ...opt, 
        [field]: field === "price" && parseFloat(value) < 0 ? "0" : value,
        _status: opt._status === "new" ? "new" : "updated"
      };
    }));
    setIsDirty(true);
  }, []);

  const handleUpdateModifier = useCallback((id: string, field: "name" | "price", value: string) => {
    setLocalModifiers(prev => prev.map(mod => {
      if (mod.id !== id) return mod;
      return { 
        ...mod, 
        [field]: field === "price" && parseFloat(value) < 0 ? "0" : value,
        _status: mod._status === "new" ? "new" : "updated"
      };
    }));
    setIsDirty(true);
  }, []);

  const handleDeleteOption = useCallback((id: string) => {
    setLocalOptions(prev => prev.map(opt => 
      opt.id === id ? { ...opt, _status: "deleted" as const } : opt
    ));
    setIsDirty(true);
  }, []);

  const handleDeleteModifier = useCallback((id: string) => {
    setLocalModifiers(prev => prev.map(mod => 
      mod.id === id ? { ...mod, _status: "deleted" as const } : mod
    ));
    setIsDirty(true);
  }, []);

  const handleDragEndOptions = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setLocalOptions(prev => {
        const activeIndex = prev.findIndex(opt => opt.id === active.id);
        const overIndex = prev.findIndex(opt => opt.id === over.id);
        const reordered = arrayMove(prev, activeIndex, overIndex);
        return normalizeOrderIndexes(reordered).map(opt => ({
          ...opt,
          _status: opt._status === "new" ? "new" : 
            (opt.order_index !== opt._originalOrderIndex ? "updated" : opt._status)
        }));
      });
      setIsDirty(true);
    }
  }, []);

  const handleDragEndModifiers = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setLocalModifiers(prev => {
        const activeIndex = prev.findIndex(mod => mod.id === active.id);
        const overIndex = prev.findIndex(mod => mod.id === over.id);
        const reordered = arrayMove(prev, activeIndex, overIndex);
        return normalizeOrderIndexes(reordered).map(mod => ({
          ...mod,
          _status: mod._status === "new" ? "new" : 
            (mod.order_index !== mod._originalOrderIndex ? "updated" : mod._status)
        }));
      });
      setIsDirty(true);
    }
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setShowCropModal(true);
    }
  };

  const handleImageCrop = async (croppedFile: File) => {
    setIsUploadingImage(true);
    try {
      const imageUrl = await uploadImage.mutateAsync({
        file: croppedFile,
        bucket: "dish-images",
        path: `${dish.id}/${croppedFile.name}`,
      });
      setLocalImageUrl(imageUrl);
      setIsDirty(true);
      toast.success("Image uploaded");
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setIsUploadingImage(false);
      setShowCropModal(false);
      setSelectedImage(null);
    }
  };

  const handleCancel = useCallback(() => {
    if (isDirty && !window.confirm("You have unsaved changes. Are you sure you want to cancel?")) {
      return;
    }
    onOpenChange(false);
  }, [isDirty, onOpenChange]);

  // Save handler
  const handleSave = useCallback(() => {
    if (saveInProgressRef.current) return;
    saveInProgressRef.current = true;

    // Validate
    if (!localName.trim()) {
      toast.error("Name is required");
      saveInProgressRef.current = false;
      return;
    }

    const invalidOptions = visibleOptions.filter(o => !o.name.trim());
    const invalidModifiers = visibleModifiers.filter(m => !m.name.trim());
    
    if (invalidOptions.length > 0 || invalidModifiers.length > 0) {
      toast.error("Please fill in all option/modifier names");
      saveInProgressRef.current = false;
      return;
    }

    // Build dish updates
    const dishUpdates: Partial<Dish> = {
      name: localName,
      description: localDescription || null,
      price: localPrice,
      calories: localCalories ? parseInt(localCalories) : null,
      image_url: localImageUrl || null,
      allergens: localAllergens,
      is_vegetarian: localVegetarian,
      is_vegan: localVegan,
      is_spicy: localSpicy,
      is_new: localNew,
      is_special: localSpecial,
      is_popular: localPopular,
      is_chef_recommendation: localChefRec,
      has_options: localHasOptions,
    };

    // Compute options/modifiers diff
    const { toCreate: newOptions, toUpdate: updatedOptions, toDelete: deletedOptions } = 
      diffOptions(initialOptionsRef.current, localOptions);
    const { toCreate: newModifiers, toUpdate: updatedModifiers, toDelete: deletedModifiers } = 
      diffModifiers(initialModifiersRef.current, localModifiers);

    // Build optimistic data
    const finalOptions: DishOption[] = visibleOptions.map((opt, idx) => ({
      id: opt._temp ? `pending_${idx}` : opt.id,
      dish_id: dish.id,
      name: opt.name,
      price: normalizePrice(opt.price),
      order_index: idx,
      created_at: opt.created_at,
    }));

    const finalModifiers: DishModifier[] = visibleModifiers.map((mod, idx) => ({
      id: mod._temp ? `pending_${idx}` : mod.id,
      dish_id: dish.id,
      name: mod.name,
      price: normalizePrice(mod.price),
      order_index: idx,
      created_at: mod.created_at,
    }));

    // INSTANT: Apply optimistic updates + close + toast
    if (restaurantId) {
      applyOptimisticOptionsUpdate(queryClient, dish.id, restaurantId, finalOptions, finalModifiers);
    } else {
      queryClient.setQueryData(["dish-options", dish.id], finalOptions);
      queryClient.setQueryData(["dish-modifiers", dish.id], finalModifiers);
    }

    toast.success("Saved", { icon: <Check className="h-4 w-4" /> });
    onOpenChange(false);

    // BACKGROUND: Execute mutations
    const tasks: MutationTask[] = [];

    // Dish update
    tasks.push({
      type: 'update-dish',
      name: 'dish',
      execute: () => updateDish.mutateAsync({ id: dish.id, updates: dishUpdates })
    });

    newOptions.forEach(opt => {
      tasks.push({
        type: 'create-option',
        name: opt.name || 'Option',
        execute: () => createOption.mutateAsync({
          dish_id: dish.id,
          name: opt.name,
          price: normalizePrice(opt.price),
          order_index: opt.order_index,
        })
      });
    });

    newModifiers.forEach(mod => {
      tasks.push({
        type: 'create-modifier',
        name: mod.name || 'Modifier',
        execute: () => createModifier.mutateAsync({
          dish_id: dish.id,
          name: mod.name,
          price: normalizePrice(mod.price),
          order_index: mod.order_index,
        })
      });
    });

    updatedOptions.forEach(opt => {
      tasks.push({
        type: 'update-option',
        name: opt.name,
        execute: () => updateOption.mutateAsync({
          id: opt.id,
          updates: { name: opt.name, price: opt.price, order_index: opt.order_index }
        })
      });
    });

    updatedModifiers.forEach(mod => {
      tasks.push({
        type: 'update-modifier',
        name: mod.name,
        execute: () => updateModifier.mutateAsync({
          id: mod.id,
          updates: { name: mod.name, price: mod.price, order_index: mod.order_index }
        })
      });
    });

    deletedOptions.forEach(opt => {
      tasks.push({
        type: 'delete-option',
        name: opt.name,
        execute: () => deleteOption.mutateAsync({ id: opt.id, dishId: dish.id })
      });
    });

    deletedModifiers.forEach(mod => {
      tasks.push({
        type: 'delete-modifier',
        name: mod.name,
        execute: () => deleteModifier.mutateAsync({ id: mod.id, dishId: dish.id })
      });
    });

    executeBackgroundMutations(tasks, dish.id, restaurantId || '', queryClient);
    saveInProgressRef.current = false;
  }, [
    localName, localDescription, localPrice, localCalories, localImageUrl, localAllergens,
    localVegetarian, localVegan, localSpicy, localNew, localSpecial, localPopular, localChefRec,
    localHasOptions, visibleOptions, visibleModifiers, localOptions, localModifiers, 
    dish.id, restaurantId, queryClient, onOpenChange,
    createOption, updateOption, deleteOption, createModifier, updateModifier, deleteModifier, updateDish
  ]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!open) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, handleSave, handleCancel]);

  // Loading state
  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] w-full">
          <DialogHeader>
            <DialogTitle>Edit Dish</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading...</span>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Dish</DialogTitle>
          </DialogHeader>

          {hasError && (
            <div className="text-center py-2 px-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Some data couldn't be loaded. You can still make changes.
              </p>
            </div>
          )}

          <div className="space-y-6">
            {/* Photo Section */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Photo</Label>
              <label className="block w-32 h-32 rounded-lg overflow-hidden cursor-pointer group relative border-2 border-dashed border-border hover:border-primary transition-colors">
                {isUploadingImage ? (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : localImageUrl ? (
                  <>
                    <img src={localImageUrl} alt={localName} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Upload className="h-6 w-6 text-white" />
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                    <Upload className="h-6 w-6 mb-1" />
                    <span className="text-xs">Upload</span>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
              </label>
            </div>

            {/* Name & Description */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dish-name" className="text-sm font-medium">Name *</Label>
                <Input
                  id="dish-name"
                  value={localName}
                  onChange={(e) => { setLocalName(e.target.value); setIsDirty(true); }}
                  placeholder="Dish name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="dish-price" className="text-sm font-medium">Price</Label>
                <Input
                  id="dish-price"
                  value={localPrice}
                  onChange={(e) => { setLocalPrice(e.target.value); setIsDirty(true); }}
                  placeholder="$0.00"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="dish-description" className="text-sm font-medium">Description</Label>
              <Textarea
                id="dish-description"
                value={localDescription}
                onChange={(e) => { setLocalDescription(e.target.value); setIsDirty(true); }}
                placeholder="Describe your dish..."
                className="mt-1 min-h-[80px]"
              />
            </div>

            <Separator />

            {/* Allergens */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Allergens</Label>
              <div className="flex flex-wrap gap-2">
                {ALLERGEN_OPTIONS.map((option) => {
                  const Icon = option.Icon;
                  const isSelected = localAllergens.includes(option.value);
                  return (
                    <Badge
                      key={option.value}
                      variant={isSelected ? "default" : "outline"}
                      className="cursor-pointer flex items-center gap-1 active:scale-95 transition-transform"
                      onClick={() => handleAllergenToggle(option.value)}
                    >
                      <Icon className="h-3 w-3" />
                      {option.label}
                    </Badge>
                  );
                })}
              </div>
            </div>

            {/* Dietary & Badges */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Dietary</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm flex items-center gap-1.5">
                      <Salad className="h-4 w-4 text-green-500" />
                      Vegetarian
                    </Label>
                    <Switch checked={localVegetarian} onCheckedChange={(v) => { setLocalVegetarian(v); setIsDirty(true); }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm flex items-center gap-1.5">
                      <Sprout className="h-4 w-4 text-green-500" />
                      Vegan
                    </Label>
                    <Switch checked={localVegan} onCheckedChange={(v) => { setLocalVegan(v); setIsDirty(true); }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm flex items-center gap-1.5">
                      <Flame className="h-4 w-4 text-red-500" />
                      Spicy
                    </Label>
                    <Switch checked={localSpicy} onCheckedChange={(v) => { setLocalSpicy(v); setIsDirty(true); }} />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Badges</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-green-500" />
                      New
                    </Label>
                    <Switch checked={localNew} onCheckedChange={(v) => { setLocalNew(v); setIsDirty(true); }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm flex items-center gap-1.5">
                      <Star className="h-4 w-4 text-orange-500" />
                      Special
                    </Label>
                    <Switch checked={localSpecial} onCheckedChange={(v) => { setLocalSpecial(v); setIsDirty(true); }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4 text-blue-500" />
                      Popular
                    </Label>
                    <Switch checked={localPopular} onCheckedChange={(v) => { setLocalPopular(v); setIsDirty(true); }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm flex items-center gap-1.5">
                      <ChefHat className="h-4 w-4 text-purple-500" />
                      Chef's Pick
                    </Label>
                    <Switch checked={localChefRec} onCheckedChange={(v) => { setLocalChefRec(v); setIsDirty(true); }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Calories */}
            <div>
              <Label htmlFor="dish-calories" className="text-sm font-medium">Calories</Label>
              <Input
                id="dish-calories"
                type="number"
                value={localCalories}
                onChange={(e) => { setLocalCalories(e.target.value); setIsDirty(true); }}
                placeholder="e.g., 450"
                className="mt-1 w-32"
              />
            </div>

            <Separator />

            {/* Size Options */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Size Options</Label>
                  <p className="text-xs text-muted-foreground">Different sizes with prices (e.g., Small, Large)</p>
                </div>
                <Switch checked={localHasOptions} onCheckedChange={(v) => { setLocalHasOptions(v); setIsDirty(true); }} />
              </div>

              {localHasOptions && (
                <>
                  <Button onClick={handleAddOption} variant="outline" size="sm" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Size
                  </Button>
                  
                  {visibleOptions.length > 0 && (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndOptions}>
                      <SortableContext items={visibleOptions.map(o => o.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-2">
                          {visibleOptions.map(opt => (
                            <SortableItem
                              key={opt.id}
                              id={opt.id}
                              name={opt.name}
                              price={opt.price}
                              onUpdate={handleUpdateOption}
                              onDelete={handleDeleteOption}
                              type="option"
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}
                </>
              )}
            </div>

            {/* Modifiers */}
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium">Add-ons & Modifiers</Label>
                <p className="text-xs text-muted-foreground">Extra toppings or upgrades</p>
              </div>

              <Button onClick={handleAddModifier} variant="outline" size="sm" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Modifier
              </Button>
              
              {visibleModifiers.length > 0 && (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndModifiers}>
                  <SortableContext items={visibleModifiers.map(m => m.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {visibleModifiers.map(mod => (
                        <SortableItem
                          key={mod.id}
                          id={mod.id}
                          name={mod.name}
                          price={mod.price}
                          onUpdate={handleUpdateModifier}
                          onDelete={handleDeleteModifier}
                          type="modifier"
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={handleCancel}>Cancel</Button>
              <Button onClick={handleSave}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {selectedImage && (
        <ImageCropModal
          open={showCropModal}
          onOpenChange={setShowCropModal}
          imageFile={selectedImage}
          onCropComplete={handleImageCrop}
        />
      )}
    </>
  );
}
