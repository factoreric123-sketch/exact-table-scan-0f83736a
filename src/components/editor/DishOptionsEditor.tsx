import { memo, useState, useCallback, useRef, useEffect, useMemo, startTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, GripVertical, X, Loader2 } from "lucide-react";
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
  invalidateAllCaches,
  normalizePrice
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface EditableDishOption extends DishOption {
  _status?: "new" | "updated" | "deleted" | "unchanged";
  _temp?: boolean;
}

interface EditableDishModifier extends DishModifier {
  _status?: "new" | "updated" | "deleted" | "unchanged";
  _temp?: boolean;
}

interface SortableItemProps {
  id: string;
  name: string;
  price: string;
  onUpdate: (id: string, field: "name" | "price", value: string) => void;
  onDelete: (id: string) => void;
  type: "option" | "modifier";
}

// Memoized sortable item component with enhanced UX
const SortableItem = memo(({ id, name, price, onUpdate, onDelete, type }: SortableItemProps) => {
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
    scale: isDragging ? 1.05 : 1,
    boxShadow: isDragging ? '0 8px 16px rgba(0,0,0,0.15)' : 'none',
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg group transition-all duration-200 hover:bg-muted/70 hover:shadow-md"
    >
      <div 
        {...attributes} 
        {...listeners} 
        className="cursor-grab active:cursor-grabbing p-2 -ml-2 touch-none"
      >
        <GripVertical className="h-6 w-6 text-muted-foreground" />
      </div>
      
      <Input
        type="text"
        placeholder={type === "option" ? "e.g., Small" : "e.g., Extra Cheese"}
        value={name}
        onChange={(e) => onUpdate(id, "name", e.target.value)}
        className="flex-1"
        autoFocus={id.startsWith("temp_")}
      />
      
      <div className="flex items-center gap-2 w-32">
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
          className="flex-1"
        />
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDelete(id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}, (prev, next) => {
  return (
    prev.id === next.id &&
    prev.name === next.name &&
    prev.price === next.price &&
    prev.type === next.type
  );
});

SortableItem.displayName = "SortableItem";

// ULTRA-OPTIMIZED diff with Map lookups for MAXIMUM SPEED
const diffOptions = (initial: EditableDishOption[], current: EditableDishOption[]) => {
  const initialMap = new Map(initial.map(o => [o.id, o]));
  const currentMap = new Map(current.map(o => [o.id, o]));
  
  const toCreate: EditableDishOption[] = [];
  const toUpdate: EditableDishOption[] = [];
  const toDelete: EditableDishOption[] = [];

  // Process current items
  for (const opt of current) {
    if (opt._status === "new") {
      toCreate.push(opt);
    } else if (opt._status === "updated") {
      toUpdate.push(opt);
    }
  }

  // Find deletions
  for (const orig of initial) {
    if (!currentMap.has(orig.id) || currentMap.get(orig.id)?._status === "deleted") {
      toDelete.push(orig);
    }
  }

  return { toCreate, toUpdate, toDelete };
};

const diffModifiers = (initial: EditableDishModifier[], current: EditableDishModifier[]) => {
  const initialMap = new Map(initial.map(m => [m.id, m]));
  const currentMap = new Map(current.map(m => [m.id, m]));
  
  const toCreate: EditableDishModifier[] = [];
  const toUpdate: EditableDishModifier[] = [];
  const toDelete: EditableDishModifier[] = [];

  for (const mod of current) {
    if (mod._status === "new") {
      toCreate.push(mod);
    } else if (mod._status === "updated") {
      toUpdate.push(mod);
    }
  }

  for (const orig of initial) {
    if (!currentMap.has(orig.id) || currentMap.get(orig.id)?._status === "deleted") {
      toDelete.push(orig);
    }
  }

  return { toCreate, toUpdate, toDelete };
};

// Normalize order indexes to 0, 1, 2, 3...
const normalizeOrderIndexes = <T extends { order_index: number }>(items: T[]): T[] => 
  items.map((item, idx) => ({ ...item, order_index: idx }));

export function DishOptionsEditor({
  dishId,
  dishName,
  hasOptions: initialHasOptions = false,
  open,
  onOpenChange,
}: DishOptionsEditorProps) {
  const queryClient = useQueryClient();
  const { data: options = [] } = useDishOptions(dishId);
  const { data: modifiers = [] } = useDishModifiers(dishId);
  const updateDish = useUpdateDish();

  const createOption = useCreateDishOptionSilent();
  const updateOption = useUpdateDishOptionSilent();
  const deleteOption = useDeleteDishOptionSilent();
  const createModifier = useCreateDishModifierSilent();
  const updateModifier = useUpdateDishModifierSilent();
  const deleteModifier = useDeleteDishModifierSilent();

  const [localOptions, setLocalOptions] = useState<EditableDishOption[]>([]);
  const [localModifiers, setLocalModifiers] = useState<EditableDishModifier[]>([]);
  const [localHasOptions, setLocalHasOptions] = useState(initialHasOptions);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  // Store initial state for diffing on save
  const initialOptionsRef = useRef<EditableDishOption[]>([]);
  const initialModifiersRef = useRef<EditableDishModifier[]>([]);

  // Constants
  const MAX_OPTIONS = 50;
  const MAX_MODIFIERS = 50;

  // Optimized drag sensors for instant response with touch support
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
        tolerance: 5,
      },
    })
  );

  // Memoize visible items for performance
  const visibleOptions = useMemo(
    () => localOptions.filter(o => o._status !== "deleted"),
    [localOptions]
  );

  const visibleModifiers = useMemo(
    () => localModifiers.filter(m => m._status !== "deleted"),
    [localModifiers]
  );

  // Initialize local state when dialog opens with loading state
  useEffect(() => {
    if (open) {
      setIsInitializing(true);
      
      const editableOptions: EditableDishOption[] = options.map(opt => ({
        ...opt,
        _status: "unchanged" as const,
      }));

      const editableModifiers: EditableDishModifier[] = modifiers.map(mod => ({
        ...mod,
        _status: "unchanged" as const,
      }));

      setLocalOptions(editableOptions);
      setLocalModifiers(editableModifiers);
      setLocalHasOptions(initialHasOptions);

      // Use structuredClone for faster deep cloning - ALWAYS update refs when dialog opens
      initialOptionsRef.current = structuredClone(editableOptions);
      initialModifiersRef.current = structuredClone(editableModifiers);
      
      // Small delay to ensure smooth rendering
      setTimeout(() => setIsInitializing(false), 50);
    } else {
      setIsDirty(false);
    }
  }, [open, options, modifiers, initialHasOptions]);

  // ============= INSTANT LOCAL HANDLERS (NO AWAIT, NO DEBOUNCE) =============
  
  const handleAddOption = useCallback(() => {
    if (localOptions.length >= MAX_OPTIONS) {
      toast.error(`Maximum ${MAX_OPTIONS} options allowed`);
      return;
    }
    
    const tempId = generateTempId();
    const tempOption: EditableDishOption = {
      id: tempId,
      dish_id: dishId,
      name: "",
      price: "0.00",
      order_index: localOptions.length,
      created_at: new Date().toISOString(),
      _status: "new",
      _temp: true,
    };
    
    setLocalOptions(prev => [...prev, tempOption]);
    startTransition(() => {
      setIsDirty(true);
    });
  }, [localOptions.length, dishId]);

  const handleAddModifier = useCallback(() => {
    if (localModifiers.length >= MAX_MODIFIERS) {
      toast.error(`Maximum ${MAX_MODIFIERS} modifiers allowed`);
      return;
    }
    
    const tempId = generateTempId();
    const tempModifier: EditableDishModifier = {
      id: tempId,
      dish_id: dishId,
      name: "",
      price: "0.00",
      order_index: localModifiers.length,
      created_at: new Date().toISOString(),
      _status: "new",
      _temp: true,
    };
    
    setLocalModifiers(prev => [...prev, tempModifier]);
    startTransition(() => {
      setIsDirty(true);
    });
  }, [localModifiers.length, dishId]);

  const handleUpdateOption = useCallback((id: string, field: "name" | "price", value: string) => {
    let finalValue = value;
    
    // Prevent negative prices
    if (field === "price") {
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue < 0) {
        finalValue = "0";
      }
    }
    
    setLocalOptions(prev => prev.map(opt => {
      if (opt.id !== id) return opt;
      const updated = { ...opt, [field]: finalValue };
      if (opt._status !== "new") {
        updated._status = "updated";
      }
      return updated;
    }));
    startTransition(() => {
      setIsDirty(true);
    });
  }, []);

  const handleUpdateModifier = useCallback((id: string, field: "name" | "price", value: string) => {
    let finalValue = value;
    
    // Prevent negative prices
    if (field === "price") {
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue < 0) {
        finalValue = "0";
      }
    }
    
    setLocalModifiers(prev => prev.map(mod => {
      if (mod.id !== id) return mod;
      const updated = { ...mod, [field]: finalValue };
      if (mod._status !== "new") {
        updated._status = "updated";
      }
      return updated;
    }));
    startTransition(() => {
      setIsDirty(true);
    });
  }, []);

  const handleDeleteOption = useCallback((id: string) => {
    setLocalOptions(prev => prev.map(opt => 
      opt.id === id ? { ...opt, _status: "deleted" as const } : opt
    ));
    startTransition(() => {
      setIsDirty(true);
    });
  }, []);

  const handleDeleteModifier = useCallback((id: string) => {
    setLocalModifiers(prev => prev.map(mod => 
      mod.id === id ? { ...mod, _status: "deleted" as const } : mod
    ));
    startTransition(() => {
      setIsDirty(true);
    });
  }, []);

  const handleDragEndOptions = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setLocalOptions(prev => {
        const activeIndex = prev.findIndex(opt => opt.id === active.id);
        const overIndex = prev.findIndex(opt => opt.id === over.id);
        const reordered = arrayMove(prev, activeIndex, overIndex);
        
        // Normalize order indexes and mark as updated
        return normalizeOrderIndexes(reordered).map(opt => ({
          ...opt,
          _status: opt._status === "new" ? "new" : "updated",
        }));
      });
      startTransition(() => {
        setIsDirty(true);
      });
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
          _status: mod._status === "new" ? "new" : "updated",
        }));
      });
      startTransition(() => {
        setIsDirty(true);
      });
    }
  }, []);

  const handleToggleHasOptions = useCallback((checked: boolean) => {
    setLocalHasOptions(checked);
    startTransition(() => {
      setIsDirty(true);
    });
  }, []);

  // Handle cancel with dirty check
  const handleCancel = useCallback(() => {
    if (isDirty) {
      const confirmed = window.confirm("You have unsaved changes. Are you sure you want to cancel?");
      if (!confirmed) return;
    }
    onOpenChange(false);
  }, [isDirty, onOpenChange]);

  // ULTRA-FAST commit engine: All mutations in parallel + validation + robust error handling
  const handleSaveAndClose = useCallback(async () => {
    // Validate all options
    const invalidOptions = localOptions
      .filter(o => o._status !== "deleted")
      .filter(o => !o.name.trim() || o.name.trim().length < 2);
    
    const invalidModifiers = localModifiers
      .filter(m => m._status !== "deleted")
      .filter(m => !m.name.trim() || m.name.trim().length < 2);
    
    if (invalidOptions.length > 0 || invalidModifiers.length > 0) {
      toast.error("Please fill in all names (minimum 2 characters)");
      return;
    }
    
    setIsSaving(true);
    
    const { toCreate: newOptions, toUpdate: updatedOptions, toDelete: deletedOptions } = diffOptions(
      initialOptionsRef.current,
      localOptions
    );
    
    const { toCreate: newModifiers, toUpdate: updatedModifiers, toDelete: deletedModifiers } = diffModifiers(
      initialModifiersRef.current,
      localModifiers
    );

    // ============= PARALLEL MUTATION EXECUTION WITH RETRY =============
    
    const retryMutation = async <T,>(
      fn: () => Promise<T>, 
      retries = 2,
      delay = 500
    ): Promise<T> => {
      try {
        return await fn();
      } catch (error) {
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
          return retryMutation(fn, retries - 1, delay * 1.5);
        }
        throw error;
      }
    };
    
    try {
      // BUILD mutation array with retry logic
      const allMutations: Promise<any>[] = [];

      // CREATE operations
      newOptions.forEach((opt) => {
        const normalizedPrice = normalizePrice(opt.price);
        allMutations.push(
          retryMutation(() => createOption.mutateAsync({
            dish_id: dishId,
            name: opt.name,
            price: normalizedPrice,
            order_index: opt.order_index,
          }))
        );
      });

      newModifiers.forEach((mod) => {
        const normalizedPrice = normalizePrice(mod.price);
        allMutations.push(
          retryMutation(() => createModifier.mutateAsync({
            dish_id: dishId,
            name: mod.name,
            price: normalizedPrice,
            order_index: mod.order_index,
          }))
        );
      });

      // UPDATE operations
      updatedOptions.forEach((opt) => {
        allMutations.push(
          retryMutation(() => updateOption.mutateAsync({
            id: opt.id,
            updates: {
              name: opt.name,
              price: opt.price,
              order_index: opt.order_index,
            },
          }))
        );
      });

      updatedModifiers.forEach((mod) => {
        allMutations.push(
          retryMutation(() => updateModifier.mutateAsync({
            id: mod.id,
            updates: {
              name: mod.name,
              price: mod.price,
              order_index: mod.order_index,
            },
          }))
        );
      });

      // DELETE operations
      deletedOptions.forEach((opt) => {
        allMutations.push(
          retryMutation(() => deleteOption.mutateAsync({ id: opt.id, dishId }))
        );
      });

      deletedModifiers.forEach((mod) => {
        allMutations.push(
          retryMutation(() => deleteModifier.mutateAsync({ id: mod.id, dishId }))
        );
      });

      // Update has_options flag if changed
      if (localHasOptions !== initialHasOptions) {
        allMutations.push(
          retryMutation(() => updateDish.mutateAsync({
            id: dishId,
            updates: { has_options: localHasOptions },
          }))
        );
      }

      // EXECUTE all mutations with partial save support
      const results = await Promise.allSettled(allMutations);
      const failed = results.filter(r => r.status === 'rejected');
      
      if (failed.length > 0) {
        console.error("Some mutations failed:", failed);
        toast.error(`Saved ${results.length - failed.length}/${results.length} changes`);
      } else {
        toast.success("Pricing options saved");
      }

      // Single cache invalidation AFTER all mutations complete
      await invalidateAllCaches(dishId, queryClient);

      // Brief success animation before close
      if (failed.length === 0) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save pricing options:", error);
      toast.error("Failed to save changes. Please try again.");
      
      // Complete rollback on error
      queryClient.invalidateQueries({ queryKey: ["dish-options", dishId] });
      queryClient.invalidateQueries({ queryKey: ["dish-modifiers", dishId] });
    } finally {
      setIsSaving(false);
    }
  }, [
    localOptions, 
    localModifiers, 
    dishId, 
    createOption, 
    createModifier, 
    updateOption, 
    updateModifier, 
    deleteOption, 
    deleteModifier,
    updateDish,
    queryClient,
    onOpenChange,
    localHasOptions,
    initialHasOptions,
  ]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!open) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Enter = Save
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSaveAndClose();
      }
      
      // Escape = Cancel
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, handleSaveAndClose, handleCancel]);

  // Show loading skeleton during initialization
  if (isInitializing) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto transition-all duration-300">
          <DialogHeader>
            <DialogTitle>Loading...</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto transition-all duration-300">
        <DialogHeader>
          <DialogTitle>
            Pricing Options for "{dishName}"
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Toggle: Enable/Disable Pricing Options */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg transition-all duration-200">
            <div>
              <Label className="text-base font-medium">Enable Pricing Options</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Allow customers to choose different sizes or variations for this dish
              </p>
            </div>
            <Switch
              checked={localHasOptions}
              onCheckedChange={handleToggleHasOptions}
            />
          </div>

          {/* Size Options Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Size Options</Label>
                <p className="text-sm text-muted-foreground">Different sizes or types (e.g., Small, Medium, Large)</p>
              </div>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={handleAddOption} 
                variant="outline" 
                size="sm"
                className="w-full transition-all duration-200 hover:scale-[1.02]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Size
              </Button>
              
              {/* Sortable Options List or Empty State */}
              {visibleOptions.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed rounded-lg">
                  <p className="text-muted-foreground mb-2">No size options yet</p>
                  <p className="text-sm text-muted-foreground">
                    Click "Add Size" to create your first option
                  </p>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEndOptions}
                >
                  <SortableContext items={visibleOptions.map(o => o.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {visibleOptions.map((opt) => (
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
            </div>
          </div>

          {/* Modifiers Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Add-ons & Modifiers</Label>
                <p className="text-sm text-muted-foreground">Extra toppings or upgrades (e.g., Extra Cheese, Bacon)</p>
              </div>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={handleAddModifier} 
                variant="outline" 
                size="sm"
                className="w-full transition-all duration-200 hover:scale-[1.02]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Modifier
              </Button>
              
              {/* Sortable Modifiers List or Empty State */}
              {visibleModifiers.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed rounded-lg">
                  <p className="text-muted-foreground mb-2">No modifiers yet</p>
                  <p className="text-sm text-muted-foreground">
                    Click "Add Modifier" to create your first modifier
                  </p>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEndModifiers}
                >
                  <SortableContext items={visibleModifiers.map(m => m.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {visibleModifiers.map((mod) => (
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
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={handleCancel} 
              disabled={isSaving}
              className="transition-all duration-200"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveAndClose} 
              disabled={isSaving}
              className="transition-all duration-200"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
