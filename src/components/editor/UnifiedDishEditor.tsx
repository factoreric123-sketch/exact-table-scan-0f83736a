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
  Flame, Sparkles, Star, TrendingUp, ChefHat, Salad, Sprout,
  AlertCircle
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

// ============= TYPES =============

interface UnifiedDishEditorProps {
  dish: Dish;
  restaurantId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface EditableDishOption extends DishOption {
  _status: "new" | "updated" | "deleted" | "unchanged";
  _temp?: boolean;
  _originalOrderIndex?: number;
  _originalName?: string;
  _originalPrice?: string;
}

interface EditableDishModifier extends DishModifier {
  _status: "new" | "updated" | "deleted" | "unchanged";
  _temp?: boolean;
  _originalOrderIndex?: number;
  _originalName?: string;
  _originalPrice?: string;
}

// ============= SORTABLE ITEM COMPONENT =============

const SortableItem = memo(({ 
  id, 
  name, 
  price, 
  onUpdate, 
  onDelete, 
  type,
  isNew 
}: {
  id: string;
  name: string;
  price: string;
  onUpdate: (id: string, field: "name" | "price", value: string) => void;
  onDelete: (id: string) => void;
  type: "option" | "modifier";
  isNew?: boolean;
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
    transition: transition || "transform 150ms ease",
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isNew && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isNew]);

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`flex items-center gap-2 p-2 bg-muted/50 rounded-lg group hover:bg-muted/70 transition-colors ${
        isDragging ? "shadow-lg ring-2 ring-primary/20" : ""
      }`}
    >
      <div 
        {...attributes} 
        {...listeners} 
        className="cursor-grab active:cursor-grabbing p-1 touch-none hover:bg-muted rounded"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      
      <Input
        ref={inputRef}
        type="text"
        placeholder={type === "option" ? "e.g., Small" : "e.g., Extra Cheese"}
        value={name}
        onChange={(e) => onUpdate(id, "name", e.target.value)}
        className="flex-1 h-8 text-sm transition-shadow focus:ring-2 focus:ring-primary/20"
      />
      
      <div className="flex items-center gap-1 w-24">
        <span className="text-sm text-muted-foreground">$</span>
        <Input
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          value={price.replace("$", "")}
          onChange={(e) => {
            const filtered = e.target.value.replace(/[^0-9.]/g, "");
            const parts = filtered.split(".");
            const cleaned = parts[0] + (parts.length > 1 ? "." + parts.slice(1).join("") : "");
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
        className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive transition-all"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}, (prev, next) => 
  prev.id === next.id && 
  prev.name === next.name && 
  prev.price === next.price && 
  prev.type === next.type &&
  prev.isNew === next.isNew
);

SortableItem.displayName = "SortableItem";

// ============= HELPER FUNCTIONS =============

const hasItemActuallyChanged = (item: EditableDishOption | EditableDishModifier): boolean => {
  if (item._status === "new") return true;
  if (item._status === "deleted") return true;
  
  const nameChanged = item.name !== item._originalName;
  const priceChanged = normalizePrice(item.price) !== normalizePrice(item._originalPrice || "0.00");
  const orderChanged = item.order_index !== item._originalOrderIndex;
  
  return nameChanged || priceChanged || orderChanged;
};

const computeDiff = <T extends EditableDishOption | EditableDishModifier>(
  items: T[],
  initialItems: T[]
): { toCreate: T[]; toUpdate: T[]; toDelete: T[] } => {
  const currentMap = new Map(items.map(item => [item.id, item]));
  const toCreate: T[] = [];
  const toUpdate: T[] = [];
  const toDelete: T[] = [];

  // Find items to create or update
  for (const item of items) {
    if (item._status === "deleted") continue;
    
    if (item._status === "new" && item._temp) {
      if (item.name.trim()) { // Only create if has a name
        toCreate.push(item);
      }
    } else if (hasItemActuallyChanged(item)) {
      toUpdate.push(item);
    }
  }

  // Find items to delete
  for (const orig of initialItems) {
    const current = currentMap.get(orig.id);
    if (!current || current._status === "deleted") {
      toDelete.push(orig);
    }
  }

  return { toCreate, toUpdate, toDelete };
};

const normalizeOrderIndexes = <T extends { order_index: number }>(items: T[]): T[] => 
  items.map((item, idx) => ({ ...item, order_index: idx }));

// ============= MAIN COMPONENT =============

export function UnifiedDishEditor({
  dish,
  restaurantId,
  open,
  onOpenChange,
}: UnifiedDishEditorProps) {
  const queryClient = useQueryClient();
  
  // Data fetching
  const { 
    data: serverOptions = [], 
    isLoading: optionsLoading, 
    isError: optionsError 
  } = useDishOptions(dish.id);
  
  const { 
    data: serverModifiers = [], 
    isLoading: modifiersLoading, 
    isError: modifiersError 
  } = useDishModifiers(dish.id);

  const updateDish = useUpdateDish();
  const uploadImage = useImageUpload();

  // Loading state with timeout protection - only show error if STILL loading after timeout
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);
  const isStillLoadingAfterTimeout = loadingTimedOut && (optionsLoading || modifiersLoading);
  const isDataLoading = (optionsLoading || modifiersLoading) && !loadingTimedOut;
  // Only show error if there's an actual error OR if we're still loading after timeout
  const hasDataError = optionsError || modifiersError || isStillLoadingAfterTimeout;

  // Track if we've initialized from server data
  const isInitializedRef = useRef(false);
  const dialogJustOpenedRef = useRef(false);

  // Saving state
  const [isSaving, setIsSaving] = useState(false);

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

  // Store initial state for diff comparison
  const initialOptionsRef = useRef<EditableDishOption[]>([]);
  const initialModifiersRef = useRef<EditableDishModifier[]>([]);
  const initialDishRef = useRef<Partial<Dish>>({});

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Computed visible items
  const visibleOptions = useMemo(
    () => localOptions.filter(o => o._status !== "deleted"),
    [localOptions]
  );

  const visibleModifiers = useMemo(
    () => localModifiers.filter(m => m._status !== "deleted"),
    [localModifiers]
  );

  // Loading timeout
  useEffect(() => {
    if (open && (optionsLoading || modifiersLoading)) {
      setLoadingTimedOut(false);
      const timer = setTimeout(() => setLoadingTimedOut(true), 2000);
      return () => clearTimeout(timer);
    }
    if (!open) {
      setLoadingTimedOut(false);
    }
  }, [open, optionsLoading, modifiersLoading]);

  // Reset initialization when dialog opens
  useEffect(() => {
    if (open) {
      dialogJustOpenedRef.current = true;
      isInitializedRef.current = false;
    } else {
      dialogJustOpenedRef.current = false;
      isInitializedRef.current = false;
    }
  }, [open]);

  // Initialize dish fields when dialog opens
  useEffect(() => {
    if (open && dialogJustOpenedRef.current) {
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
      setIsDirty(false);
      setIsSaving(false);

      // Store initial dish state for comparison
      initialDishRef.current = {
        name: dish.name,
        description: dish.description,
        price: dish.price,
        calories: dish.calories,
        image_url: dish.image_url,
        allergens: dish.allergens,
        is_vegetarian: dish.is_vegetarian,
        is_vegan: dish.is_vegan,
        is_spicy: dish.is_spicy,
        is_new: dish.is_new,
        is_special: dish.is_special,
        is_popular: dish.is_popular,
        is_chef_recommendation: dish.is_chef_recommendation,
        has_options: dish.has_options,
      };
    }
  }, [open, dish]);

  // Initialize options/modifiers from server data ONCE when available
  useEffect(() => {
    if (!open || isInitializedRef.current) return;
    if (optionsLoading || modifiersLoading) return;

    const editableOptions: EditableDishOption[] = serverOptions.map(opt => ({
      ...opt,
      _status: "unchanged" as const,
      _originalOrderIndex: opt.order_index,
      _originalName: opt.name,
      _originalPrice: opt.price,
    }));

    const editableModifiers: EditableDishModifier[] = serverModifiers.map(mod => ({
      ...mod,
      _status: "unchanged" as const,
      _originalOrderIndex: mod.order_index,
      _originalName: mod.name,
      _originalPrice: mod.price,
    }));

    setLocalOptions(editableOptions);
    setLocalModifiers(editableModifiers);
    initialOptionsRef.current = editableOptions.map(o => ({ ...o }));
    initialModifiersRef.current = editableModifiers.map(m => ({ ...m }));
    isInitializedRef.current = true;
  }, [open, serverOptions, serverModifiers, optionsLoading, modifiersLoading]);

  // ============= HANDLERS =============

  const handleAllergenToggle = useCallback((allergen: string) => {
    setLocalAllergens(prev => 
      prev.includes(allergen) 
        ? prev.filter(a => a !== allergen) 
        : [...prev, allergen]
    );
    setIsDirty(true);
  }, []);

  const handleAddOption = useCallback(() => {
    const newOption: EditableDishOption = {
      id: generateTempId(),
      dish_id: dish.id,
      name: "",
      price: "0.00",
      order_index: localOptions.filter(o => o._status !== "deleted").length,
      created_at: new Date().toISOString(),
      _status: "new",
      _temp: true,
    };
    setLocalOptions(prev => [...prev, newOption]);
    setIsDirty(true);
  }, [dish.id, localOptions]);

  const handleAddModifier = useCallback(() => {
    const newModifier: EditableDishModifier = {
      id: generateTempId(),
      dish_id: dish.id,
      name: "",
      price: "0.00",
      order_index: localModifiers.filter(m => m._status !== "deleted").length,
      created_at: new Date().toISOString(),
      _status: "new",
      _temp: true,
    };
    setLocalModifiers(prev => [...prev, newModifier]);
    setIsDirty(true);
  }, [dish.id, localModifiers]);

  const handleUpdateOption = useCallback((id: string, field: "name" | "price", value: string) => {
    setLocalOptions(prev => prev.map(opt => {
      if (opt.id !== id) return opt;
      const newValue = field === "price" && parseFloat(value) < 0 ? "0" : value;
      return { 
        ...opt, 
        [field]: newValue,
        _status: opt._status === "new" ? "new" : "updated" as const
      };
    }));
    setIsDirty(true);
  }, []);

  const handleUpdateModifier = useCallback((id: string, field: "name" | "price", value: string) => {
    setLocalModifiers(prev => prev.map(mod => {
      if (mod.id !== id) return mod;
      const newValue = field === "price" && parseFloat(value) < 0 ? "0" : value;
      return { 
        ...mod, 
        [field]: newValue,
        _status: mod._status === "new" ? "new" : "updated" as const
      };
    }));
    setIsDirty(true);
  }, []);

  const handleDeleteOption = useCallback((id: string) => {
    setLocalOptions(prev => {
      const item = prev.find(o => o.id === id);
      if (!item) return prev;
      
      // If it's a new temp item, just remove it entirely
      if (item._temp) {
        return prev.filter(o => o.id !== id);
      }
      
      // Otherwise mark as deleted
      return prev.map(opt => 
        opt.id === id ? { ...opt, _status: "deleted" as const } : opt
      );
    });
    setIsDirty(true);
  }, []);

  const handleDeleteModifier = useCallback((id: string) => {
    setLocalModifiers(prev => {
      const item = prev.find(m => m.id === id);
      if (!item) return prev;
      
      if (item._temp) {
        return prev.filter(m => m.id !== id);
      }
      
      return prev.map(mod => 
        mod.id === id ? { ...mod, _status: "deleted" as const } : mod
      );
    });
    setIsDirty(true);
  }, []);

  const handleDragEndOptions = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setLocalOptions(prev => {
      const visible = prev.filter(o => o._status !== "deleted");
      const activeIndex = visible.findIndex(opt => opt.id === active.id);
      const overIndex = visible.findIndex(opt => opt.id === over.id);
      
      if (activeIndex === -1 || overIndex === -1) return prev;

      const reordered = arrayMove(visible, activeIndex, overIndex);
      const normalized = normalizeOrderIndexes(reordered);
      
      // Create a map of new order indexes
      const orderMap = new Map(normalized.map(item => [item.id, item.order_index]));
      
      // Update all items with new order indexes
      return prev.map(opt => {
        if (opt._status === "deleted") return opt;
        const newOrderIndex = orderMap.get(opt.id);
        if (newOrderIndex === undefined) return opt;
        
        const orderChanged = newOrderIndex !== opt._originalOrderIndex;
        return {
          ...opt,
          order_index: newOrderIndex,
          _status: opt._status === "new" ? "new" : 
            (orderChanged || opt._status === "updated") ? "updated" : "unchanged"
        } as EditableDishOption;
      });
    });
    setIsDirty(true);
  }, []);

  const handleDragEndModifiers = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setLocalModifiers(prev => {
      const visible = prev.filter(m => m._status !== "deleted");
      const activeIndex = visible.findIndex(mod => mod.id === active.id);
      const overIndex = visible.findIndex(mod => mod.id === over.id);
      
      if (activeIndex === -1 || overIndex === -1) return prev;

      const reordered = arrayMove(visible, activeIndex, overIndex);
      const normalized = normalizeOrderIndexes(reordered);
      
      const orderMap = new Map(normalized.map(item => [item.id, item.order_index]));
      
      return prev.map(mod => {
        if (mod._status === "deleted") return mod;
        const newOrderIndex = orderMap.get(mod.id);
        if (newOrderIndex === undefined) return mod;
        
        const orderChanged = newOrderIndex !== mod._originalOrderIndex;
        return {
          ...mod,
          order_index: newOrderIndex,
          _status: mod._status === "new" ? "new" : 
            (orderChanged || mod._status === "updated") ? "updated" : "unchanged"
        } as EditableDishModifier;
      });
    });
    setIsDirty(true);
  }, []);

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setShowCropModal(true);
    }
    // Reset input so same file can be selected again
    e.target.value = "";
  }, []);

  const handleImageCrop = useCallback(async (croppedFile: File) => {
    setIsUploadingImage(true);
    try {
      const imageUrl = await uploadImage.mutateAsync({
        file: croppedFile,
        bucket: "dish-images",
        path: `${dish.id}/${Date.now()}-${croppedFile.name}`,
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
  }, [dish.id, uploadImage]);

  const handleCancel = useCallback(() => {
    if (isDirty) {
      const confirmed = window.confirm("You have unsaved changes. Discard them?");
      if (!confirmed) return;
    }
    onOpenChange(false);
  }, [isDirty, onOpenChange]);

  // ============= SAVE HANDLER =============

  const handleSave = useCallback(async () => {
    // Double-click protection
    if (isSaving) return;
    setIsSaving(true);

    // Validation
    if (!localName.trim()) {
      toast.error("Name is required");
      setIsSaving(false);
      return;
    }

    // Validate options/modifiers have names
    const invalidOptions = visibleOptions.filter(o => o._status === "new" && !o.name.trim());
    const invalidModifiers = visibleModifiers.filter(m => m._status === "new" && !m.name.trim());
    
    if (invalidOptions.length > 0 || invalidModifiers.length > 0) {
      toast.error("Please fill in all option/modifier names or remove empty ones");
      setIsSaving(false);
      return;
    }

    try {
      // Build dish updates
      const dishUpdates: Partial<Dish> = {
        name: localName.trim(),
        description: localDescription.trim() || null,
        price: normalizePrice(localPrice),
        calories: localCalories ? parseInt(localCalories, 10) : null,
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

      // Compute diffs
      const optionsDiff = computeDiff(localOptions, initialOptionsRef.current);
      const modifiersDiff = computeDiff(localModifiers, initialModifiersRef.current);

      // Build optimistic cache data
      const finalOptions: DishOption[] = visibleOptions
        .filter(o => o.name.trim()) // Only include valid items
        .map((opt, idx) => ({
          id: opt._temp ? `pending_${idx}` : opt.id,
          dish_id: dish.id,
          name: opt.name.trim(),
          price: normalizePrice(opt.price),
          order_index: idx,
          created_at: opt.created_at,
        }));

      const finalModifiers: DishModifier[] = visibleModifiers
        .filter(m => m.name.trim())
        .map((mod, idx) => ({
          id: mod._temp ? `pending_${idx}` : mod.id,
          dish_id: dish.id,
          name: mod.name.trim(),
          price: normalizePrice(mod.price),
          order_index: idx,
          created_at: mod.created_at,
        }));

      // INSTANT: Apply optimistic updates
      applyOptimisticOptionsUpdate(queryClient, dish.id, restaurantId, finalOptions, finalModifiers);

      // Close dialog and show success toast INSTANTLY
      toast.success("Saved", { 
        icon: <Check className="h-4 w-4" />,
        duration: 2000
      });
      onOpenChange(false);

      // BACKGROUND: Execute all mutations
      const tasks: MutationTask[] = [];

      // Dish update task
      tasks.push({
        type: 'update-dish',
        name: 'dish',
        execute: () => updateDish.mutateAsync({ id: dish.id, updates: dishUpdates })
      });

      // Option tasks
      for (const opt of optionsDiff.toCreate) {
        tasks.push({
          type: 'create-option',
          name: opt.name || 'Option',
          execute: () => createOption.mutateAsync({
            dish_id: dish.id,
            name: opt.name.trim(),
            price: normalizePrice(opt.price),
            order_index: opt.order_index,
          })
        });
      }

      for (const opt of optionsDiff.toUpdate) {
        tasks.push({
          type: 'update-option',
          name: opt.name,
          execute: () => updateOption.mutateAsync({
            id: opt.id,
            updates: { 
              name: opt.name.trim(), 
              price: normalizePrice(opt.price), 
              order_index: opt.order_index 
            }
          })
        });
      }

      for (const opt of optionsDiff.toDelete) {
        tasks.push({
          type: 'delete-option',
          name: opt.name,
          execute: () => deleteOption.mutateAsync({ id: opt.id, dishId: dish.id })
        });
      }

      // Modifier tasks
      for (const mod of modifiersDiff.toCreate) {
        tasks.push({
          type: 'create-modifier',
          name: mod.name || 'Modifier',
          execute: () => createModifier.mutateAsync({
            dish_id: dish.id,
            name: mod.name.trim(),
            price: normalizePrice(mod.price),
            order_index: mod.order_index,
          })
        });
      }

      for (const mod of modifiersDiff.toUpdate) {
        tasks.push({
          type: 'update-modifier',
          name: mod.name,
          execute: () => updateModifier.mutateAsync({
            id: mod.id,
            updates: { 
              name: mod.name.trim(), 
              price: normalizePrice(mod.price), 
              order_index: mod.order_index 
            }
          })
        });
      }

      for (const mod of modifiersDiff.toDelete) {
        tasks.push({
          type: 'delete-modifier',
          name: mod.name,
          execute: () => deleteModifier.mutateAsync({ id: mod.id, dishId: dish.id })
        });
      }

      // Execute all background mutations
      executeBackgroundMutations(tasks, dish.id, restaurantId, queryClient);

    } catch (error) {
      toast.error("Failed to save changes");
      setIsSaving(false);
    }
  }, [
    isSaving, localName, localDescription, localPrice, localCalories, localImageUrl,
    localAllergens, localVegetarian, localVegan, localSpicy, localNew, localSpecial,
    localPopular, localChefRec, localHasOptions, visibleOptions, visibleModifiers,
    localOptions, localModifiers, dish.id, restaurantId, queryClient, onOpenChange,
    createOption, updateOption, deleteOption, createModifier, updateModifier, 
    deleteModifier, updateDish
  ]);

  // ============= KEYBOARD SHORTCUTS =============

  useEffect(() => {
    if (!open) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Save on Cmd/Ctrl + Enter
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        handleSave();
      }
      // Cancel on Escape (only if not in an input)
      if (e.key === 'Escape') {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          handleCancel();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [open, handleSave, handleCancel]);

  // ============= RENDER =============

  // Loading state
  if (isDataLoading) {
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
      <Dialog open={open} onOpenChange={(newOpen) => {
        if (!newOpen && isDirty && !isSaving) {
          const confirmed = window.confirm("You have unsaved changes. Discard them?");
          if (!confirmed) return;
        }
        onOpenChange(newOpen);
      }}>
        <DialogContent className="max-w-[95vw] w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Edit Dish
              {isDirty && (
                <Badge variant="outline" className="text-xs font-normal">
                  Unsaved
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {hasDataError && (
            <div className="flex items-center gap-2 py-2 px-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Some data couldn't be loaded. You can still make changes.
              </p>
            </div>
          )}

          <div className="space-y-4">
            {/* Row 1: Photo + Name/Price/Description + Dietary/Badges */}
            <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto_auto] gap-4 items-start">
              {/* Photo */}
              <div>
                <Label className="text-xs font-medium mb-1 block">Photo</Label>
                <label className="block w-24 h-24 rounded-lg overflow-hidden cursor-pointer group relative border-2 border-dashed border-border hover:border-primary transition-colors">
                  {isUploadingImage ? (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  ) : localImageUrl ? (
                    <>
                      <img src={localImageUrl} alt={localName} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Upload className="h-5 w-5 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                      <Upload className="h-5 w-5 mb-1" />
                      <span className="text-xs">Upload</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                </label>
              </div>

              {/* Name, Price, Description */}
              <div className="space-y-2 min-w-0">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="dish-name" className="text-xs font-medium">Name *</Label>
                    <Input
                      id="dish-name"
                      value={localName}
                      onChange={(e) => { setLocalName(e.target.value); setIsDirty(true); }}
                      placeholder="Dish name"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dish-price" className="text-xs font-medium">Price</Label>
                    <Input
                      id="dish-price"
                      value={localPrice}
                      onChange={(e) => { setLocalPrice(e.target.value); setIsDirty(true); }}
                      onBlur={(e) => {
                        const normalized = normalizePrice(e.target.value);
                        if (normalized !== localPrice) {
                          setLocalPrice(normalized);
                        }
                      }}
                      placeholder="$0.00"
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="dish-description" className="text-xs font-medium">Description</Label>
                  <Textarea
                    id="dish-description"
                    value={localDescription}
                    onChange={(e) => { setLocalDescription(e.target.value); setIsDirty(true); }}
                    placeholder="Describe your dish..."
                    className="min-h-[60px] text-sm resize-none"
                  />
                </div>
              </div>

              {/* Dietary */}
              <div className="space-y-1 min-w-[140px]">
                <Label className="text-xs font-medium">Dietary</Label>
                <div className="flex items-center justify-between gap-2 py-0.5">
                  <Label className="text-xs flex items-center gap-1 cursor-pointer">
                    <Salad className="h-3 w-3 text-green-500" />
                    Vegetarian
                  </Label>
                  <Switch 
                    checked={localVegetarian} 
                    onCheckedChange={(v) => { setLocalVegetarian(v); setIsDirty(true); }} 
                    className="scale-90" 
                  />
                </div>
                <div className="flex items-center justify-between gap-2 py-0.5">
                  <Label className="text-xs flex items-center gap-1 cursor-pointer">
                    <Sprout className="h-3 w-3 text-green-500" />
                    Vegan
                  </Label>
                  <Switch 
                    checked={localVegan} 
                    onCheckedChange={(v) => { setLocalVegan(v); setIsDirty(true); }} 
                    className="scale-90" 
                  />
                </div>
                <div className="flex items-center justify-between gap-2 py-0.5">
                  <Label className="text-xs flex items-center gap-1 cursor-pointer">
                    <Flame className="h-3 w-3 text-red-500" />
                    Spicy
                  </Label>
                  <Switch 
                    checked={localSpicy} 
                    onCheckedChange={(v) => { setLocalSpicy(v); setIsDirty(true); }} 
                    className="scale-90" 
                  />
                </div>
              </div>

              {/* Badges */}
              <div className="space-y-1 min-w-[130px]">
                <Label className="text-xs font-medium">Badges</Label>
                <div className="flex items-center justify-between gap-2 py-0.5">
                  <Label className="text-xs flex items-center gap-1 cursor-pointer">
                    <Sparkles className="h-3 w-3 text-green-500" />
                    New
                  </Label>
                  <Switch 
                    checked={localNew} 
                    onCheckedChange={(v) => { setLocalNew(v); setIsDirty(true); }} 
                    className="scale-90" 
                  />
                </div>
                <div className="flex items-center justify-between gap-2 py-0.5">
                  <Label className="text-xs flex items-center gap-1 cursor-pointer">
                    <Star className="h-3 w-3 text-orange-500" />
                    Special
                  </Label>
                  <Switch 
                    checked={localSpecial} 
                    onCheckedChange={(v) => { setLocalSpecial(v); setIsDirty(true); }} 
                    className="scale-90" 
                  />
                </div>
                <div className="flex items-center justify-between gap-2 py-0.5">
                  <Label className="text-xs flex items-center gap-1 cursor-pointer">
                    <TrendingUp className="h-3 w-3 text-blue-500" />
                    Popular
                  </Label>
                  <Switch 
                    checked={localPopular} 
                    onCheckedChange={(v) => { setLocalPopular(v); setIsDirty(true); }} 
                    className="scale-90" 
                  />
                </div>
                <div className="flex items-center justify-between gap-2 py-0.5">
                  <Label className="text-xs flex items-center gap-1 cursor-pointer">
                    <ChefHat className="h-3 w-3 text-purple-500" />
                    Chef's Pick
                  </Label>
                  <Switch 
                    checked={localChefRec} 
                    onCheckedChange={(v) => { setLocalChefRec(v); setIsDirty(true); }} 
                    className="scale-90" 
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Row 2: Allergens + Calories */}
            <div className="flex flex-col md:flex-row items-start gap-4 md:gap-6">
              <div className="flex-1">
                <Label className="text-xs font-medium mb-1 block">Allergens</Label>
                <div className="flex flex-wrap gap-1.5">
                  {ALLERGEN_OPTIONS.map((option) => {
                    const Icon = option.Icon;
                    const isSelected = localAllergens.includes(option.value);
                    return (
                      <Badge
                        key={option.value}
                        variant={isSelected ? "default" : "outline"}
                        className="cursor-pointer flex items-center gap-1 active:scale-95 transition-all text-xs py-0.5 hover:bg-primary/10"
                        onClick={() => handleAllergenToggle(option.value)}
                      >
                        <Icon className="h-3 w-3" />
                        {option.label}
                      </Badge>
                    );
                  })}
                </div>
              </div>
              <div className="w-24">
                <Label htmlFor="dish-calories" className="text-xs font-medium">Calories</Label>
                <Input
                  id="dish-calories"
                  type="number"
                  min="0"
                  value={localCalories}
                  onChange={(e) => { setLocalCalories(e.target.value); setIsDirty(true); }}
                  placeholder="e.g., 450"
                  className="h-8 text-sm"
                />
              </div>
            </div>

            <Separator />

            {/* Row 3: Size Options + Modifiers side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Size Options */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs font-medium">Size Options</Label>
                    <p className="text-xs text-muted-foreground">Different sizes with prices</p>
                  </div>
                  <Switch 
                    checked={localHasOptions} 
                    onCheckedChange={(v) => { setLocalHasOptions(v); setIsDirty(true); }} 
                    className="scale-90" 
                  />
                </div>

                {localHasOptions && (
                  <>
                    <Button 
                      onClick={handleAddOption} 
                      variant="outline" 
                      size="sm" 
                      className="w-full h-8 text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Size
                    </Button>
                    
                    {visibleOptions.length > 0 && (
                      <DndContext 
                        sensors={sensors} 
                        collisionDetection={closestCenter} 
                        onDragEnd={handleDragEndOptions}
                      >
                        <SortableContext 
                          items={visibleOptions.map(o => o.id)} 
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                            {visibleOptions.map((opt, idx) => (
                              <SortableItem
                                key={opt.id}
                                id={opt.id}
                                name={opt.name}
                                price={opt.price}
                                onUpdate={handleUpdateOption}
                                onDelete={handleDeleteOption}
                                type="option"
                                isNew={opt._temp && idx === visibleOptions.length - 1}
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
              <div className="space-y-2">
                <div>
                  <Label className="text-xs font-medium">Add-ons & Modifiers</Label>
                  <p className="text-xs text-muted-foreground">Extra toppings or upgrades</p>
                </div>

                <Button 
                  onClick={handleAddModifier} 
                  variant="outline" 
                  size="sm" 
                  className="w-full h-8 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Modifier
                </Button>
                
                {visibleModifiers.length > 0 && (
                  <DndContext 
                    sensors={sensors} 
                    collisionDetection={closestCenter} 
                    onDragEnd={handleDragEndModifiers}
                  >
                    <SortableContext 
                      items={visibleModifiers.map(m => m.id)} 
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                        {visibleModifiers.map((mod, idx) => (
                          <SortableItem
                            key={mod.id}
                            id={mod.id}
                            name={mod.name}
                            price={mod.price}
                            onUpdate={handleUpdateModifier}
                            onDelete={handleDeleteModifier}
                            type="modifier"
                            isNew={mod._temp && idx === visibleModifiers.length - 1}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t">
              <p className="text-xs text-muted-foreground hidden md:block">
                Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">⌘</kbd>+<kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Enter</kbd> to save
              </p>
              <div className="flex gap-2 ml-auto">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="min-w-[100px]"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {selectedImage && (
        <ImageCropModal
          open={showCropModal}
          onOpenChange={(open) => {
            setShowCropModal(open);
            if (!open) setSelectedImage(null);
          }}
          imageFile={selectedImage}
          onCropComplete={handleImageCrop}
        />
      )}
    </>
  );
}
