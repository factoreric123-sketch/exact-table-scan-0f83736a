import { memo, useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, GripVertical, X, Check, Loader2 } from "lucide-react";
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useUpdateDish } from "@/hooks/useDishes";
import { useDishOptions } from "@/hooks/useDishOptions";
import { useDishModifiers } from "@/hooks/useDishModifiers";
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

interface DishOptionsEditorProps {
  dishId: string;
  dishName: string;
  hasOptions: boolean;
  restaurantId?: string;
  forceTwoDecimals?: boolean;
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

interface SortableItemProps {
  id: string;
  name: string;
  price: string;
  onUpdate: (id: string, field: "name" | "price", value: string) => void;
  onDelete: (id: string) => void;
  type: "option" | "modifier";
  forceTwoDecimals?: boolean;
}

// Memoized sortable item - ultra-lightweight
const SortableItem = memo(({ id, name, price, onUpdate, onDelete, type, forceTwoDecimals }: SortableItemProps) => {
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
      className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg group hover:bg-muted/70"
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-2 -ml-2 touch-none">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      
      <Input
        type="text"
        placeholder={type === "option" ? "e.g., Small" : "e.g., Extra Cheese"}
        value={name}
        onChange={(e) => onUpdate(id, "name", e.target.value)}
        className="flex-1"
        autoFocus={id.startsWith("temp_")}
      />
      
      <div className="flex items-center gap-2 w-28">
        <span className="text-sm text-muted-foreground">$</span>
        <Input
          type="text"
          placeholder={forceTwoDecimals ? "0.00" : "0"}
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
          className="flex-1"
        />
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDelete(id)}
        className="opacity-0 group-hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}, (prev, next) => 
  prev.id === next.id && prev.name === next.name && prev.price === next.price && prev.type === next.type && prev.forceTwoDecimals === next.forceTwoDecimals
);

SortableItem.displayName = "SortableItem";

// Fast diff with Map lookups
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

export function DishOptionsEditor({
  dishId,
  dishName,
  hasOptions: initialHasOptions = false,
  restaurantId,
  forceTwoDecimals = false,
  open,
  onOpenChange,
}: DishOptionsEditorProps) {
  const queryClient = useQueryClient();
  const { data: options = [], isLoading: optionsLoading, isError: optionsError } = useDishOptions(dishId);
  const { data: modifiers = [], isLoading: modifiersLoading, isError: modifiersError } = useDishModifiers(dishId);
  const updateDish = useUpdateDish();

  // Loading timeout protection - never show loading for more than 2 seconds
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);
  const isLoading = (optionsLoading || modifiersLoading) && !loadingTimedOut;
  // Only show error if there's an actual query error OR still loading after timeout (not just timeout with no data yet)
  const hasDataError = (optionsError || modifiersError) || (loadingTimedOut && (optionsLoading || modifiersLoading));

  useEffect(() => {
    if (open && (optionsLoading || modifiersLoading)) {
      setLoadingTimedOut(false);
      const timer = setTimeout(() => setLoadingTimedOut(true), 2000);
      return () => clearTimeout(timer);
    }
    if (!open) setLoadingTimedOut(false);
  }, [open, optionsLoading, modifiersLoading]);

  const createOption = useCreateDishOptionSilent();
  const updateOption = useUpdateDishOptionSilent();
  const deleteOption = useDeleteDishOptionSilent();
  const createModifier = useCreateDishModifierSilent();
  const updateModifier = useUpdateDishModifierSilent();
  const deleteModifier = useDeleteDishModifierSilent();

  const [localOptions, setLocalOptions] = useState<EditableDishOption[]>([]);
  const [localModifiers, setLocalModifiers] = useState<EditableDishModifier[]>([]);
  const [localHasOptions, setLocalHasOptions] = useState(initialHasOptions);
  const [isDirty, setIsDirty] = useState(false);
  
  const initialOptionsRef = useRef<EditableDishOption[]>([]);
  const initialModifiersRef = useRef<EditableDishModifier[]>([]);
  const saveInProgressRef = useRef(false);
  // Track if we've initialized for this session to prevent background refetches from overwriting edits
  const isInitializedRef = useRef(false);

  const MAX_OPTIONS = 50;
  const MAX_MODIFIERS = 50;

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

  // Initialize ONLY once when dialog opens - prevent background refetches from overwriting user edits
  useEffect(() => {
    if (open && !isInitializedRef.current) {
      isInitializedRef.current = true;
      
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
      setLocalHasOptions(initialHasOptions);
      setIsDirty(false);

      initialOptionsRef.current = editableOptions.map(o => ({ ...o }));
      initialModifiersRef.current = editableModifiers.map(m => ({ ...m }));
    }
    
    // Reset initialization flag when dialog closes
    if (!open) {
      isInitializedRef.current = false;
    }
  }, [open, options, modifiers, initialHasOptions]);

  const handleAddOption = useCallback(() => {
    if (localOptions.length >= MAX_OPTIONS) {
      toast.error(`Maximum ${MAX_OPTIONS} options allowed`);
      return;
    }
    
    setLocalOptions(prev => [...prev, {
      id: generateTempId(),
      dish_id: dishId,
      name: "",
      price: "0.00",
      order_index: prev.length,
      created_at: new Date().toISOString(),
      _status: "new",
      _temp: true,
    }]);
    setIsDirty(true);
  }, [localOptions.length, dishId]);

  const handleAddModifier = useCallback(() => {
    if (localModifiers.length >= MAX_MODIFIERS) {
      toast.error(`Maximum ${MAX_MODIFIERS} modifiers allowed`);
      return;
    }
    
    setLocalModifiers(prev => [...prev, {
      id: generateTempId(),
      dish_id: dishId,
      name: "",
      price: "0.00",
      order_index: prev.length,
      created_at: new Date().toISOString(),
      _status: "new",
      _temp: true,
    }]);
    setIsDirty(true);
  }, [localModifiers.length, dishId]);

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

  const handleToggleHasOptions = useCallback((checked: boolean) => {
    setLocalHasOptions(checked);
    setIsDirty(true);
  }, []);

  const handleCancel = useCallback(() => {
    if (isDirty && !window.confirm("You have unsaved changes. Are you sure you want to cancel?")) {
      return;
    }
    onOpenChange(false);
  }, [isDirty, onOpenChange]);

  // ============= ULTRA-FAST OPTIMISTIC SAVE =============
  const handleSaveAndClose = useCallback(() => {
    if (saveInProgressRef.current) return;
    saveInProgressRef.current = true;

    // INSTANT validation
    const invalidOptions = visibleOptions.filter(o => !o.name.trim());
    const invalidModifiers = visibleModifiers.filter(m => !m.name.trim());
    
    if (invalidOptions.length > 0 || invalidModifiers.length > 0) {
      toast.error("Please fill in all names");
      saveInProgressRef.current = false;
      return;
    }

    // Compute diff
    const { toCreate: newOptions, toUpdate: updatedOptions, toDelete: deletedOptions } = 
      diffOptions(initialOptionsRef.current, localOptions);
    const { toCreate: newModifiers, toUpdate: updatedModifiers, toDelete: deletedModifiers } = 
      diffModifiers(initialModifiersRef.current, localModifiers);
    
    const hasChanges = newOptions.length > 0 || updatedOptions.length > 0 || deletedOptions.length > 0 ||
                       newModifiers.length > 0 || updatedModifiers.length > 0 || deletedModifiers.length > 0 ||
                       localHasOptions !== initialHasOptions;

    // NO CHANGES = INSTANT CLOSE
    if (!hasChanges) {
      onOpenChange(false);
      saveInProgressRef.current = false;
      return;
    }

    // Build optimistic data
    const finalOptions: DishOption[] = visibleOptions.map((opt, idx) => ({
      id: opt._temp ? `pending_${idx}` : opt.id,
      dish_id: dishId,
      name: opt.name,
      price: normalizePrice(opt.price),
      order_index: idx,
      created_at: opt.created_at,
    }));

    const finalModifiers: DishModifier[] = visibleModifiers.map((mod, idx) => ({
      id: mod._temp ? `pending_${idx}` : mod.id,
      dish_id: dishId,
      name: mod.name,
      price: normalizePrice(mod.price),
      order_index: idx,
      created_at: mod.created_at,
    }));

    // ⚡ INSTANT: Apply optimistic update + close dialog + show toast
    // CRITICAL: When hasOptions is FALSE, pass EMPTY arrays so preview doesn't show options
    // This is the key to instant enable/disable toggle sync
    const optionsForCache = localHasOptions ? finalOptions : [];
    const modifiersForCache = localHasOptions ? finalModifiers : [];
    
    if (restaurantId) {
      applyOptimisticOptionsUpdate(queryClient, dishId, restaurantId, optionsForCache, modifiersForCache, localHasOptions);
    } else {
      queryClient.setQueryData(["dish-options", dishId], optionsForCache);
      queryClient.setQueryData(["dish-modifiers", dishId], modifiersForCache);
    }
    
    toast.success("Saved", { icon: <Check className="h-4 w-4" /> });
    onOpenChange(false);

    // ⚡ BACKGROUND: Execute mutations
    const tasks: MutationTask[] = [];

    newOptions.forEach(opt => {
      tasks.push({
        type: 'create-option',
        name: opt.name || 'Option',
        execute: () => createOption.mutateAsync({
          dish_id: dishId,
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
          dish_id: dishId,
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
        execute: () => deleteOption.mutateAsync({ id: opt.id, dishId })
      });
    });

    deletedModifiers.forEach(mod => {
      tasks.push({
        type: 'delete-modifier',
        name: mod.name,
        execute: () => deleteModifier.mutateAsync({ id: mod.id, dishId })
      });
    });

    if (localHasOptions !== initialHasOptions) {
      tasks.push({
        type: 'update-dish',
        name: 'has_options',
        execute: () => updateDish.mutateAsync({ id: dishId, updates: { has_options: localHasOptions } })
      });
    }

    executeBackgroundMutations(tasks, dishId, restaurantId || '', queryClient);
    saveInProgressRef.current = false;

  }, [
    visibleOptions, visibleModifiers, localOptions, localModifiers, dishId, restaurantId,
    localHasOptions, initialHasOptions, queryClient, onOpenChange,
    createOption, updateOption, deleteOption, createModifier, updateModifier, deleteModifier, updateDish
  ]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!open) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSaveAndClose();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, handleSaveAndClose, handleCancel]);

  // Show loading state briefly (max 2 seconds)
  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pricing Options for "{dishName}"</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading options...</span>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl min-h-[8-vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pricing Options for "{dishName}"</DialogTitle>
        </DialogHeader>

        {hasDataError && (
          <div className="text-center py-4 px-4 mb-4 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground">
              {loadingTimedOut ? "Loading took too long. You can still add new options below." : "Could not load existing options. You can still add new ones."}
            </p>
          </div>
        )}

        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div>
              <Label className="text-base font-medium">Enable Pricing Options</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Allow customers to choose different sizes or variations
              </p>
            </div>
            <Switch checked={localHasOptions} onCheckedChange={handleToggleHasOptions} />
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Size Options</Label>
              <p className="text-sm text-muted-foreground">Different sizes (e.g., Small, Medium, Large)</p>
            </div>

            <Button onClick={handleAddOption} variant="outline" size="sm" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Size
            </Button>
            
            {visibleOptions.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 text-center border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground text-sm">No size options yet</p>
              </div>
            ) : (
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
                        forceTwoDecimals={forceTwoDecimals}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Add-ons & Modifiers</Label>
              <p className="text-sm text-muted-foreground">Extra toppings or upgrades</p>
            </div>

            <Button onClick={handleAddModifier} variant="outline" size="sm" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Modifier
            </Button>
            
            {visibleModifiers.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 text-center border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground text-sm">No modifiers yet</p>
              </div>
            ) : (
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
                        forceTwoDecimals={forceTwoDecimals}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleCancel}>Cancel</Button>
            <Button onClick={handleSaveAndClose}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
