import { useEffect, useState, useRef, useCallback, memo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, GripVertical, X } from "lucide-react";
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDishOptions } from "@/hooks/useDishOptions";
import { useDishModifiers } from "@/hooks/useDishModifiers";
import { useUpdateDish } from "@/hooks/useDishes";
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
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { DishOption } from "@/hooks/useDishOptions";
import type { DishModifier } from "@/hooks/useDishModifiers";

interface DishOptionsEditorProps {
  dishId: string;
  dishName: string;
  hasOptions: boolean;
  subcategoryId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Editable types with local metadata for tracking changes
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

// Optimized memoized sortable item component for 60fps performance
const SortableItem = memo(({
  id,
  name,
  price,
  onUpdate,
  onDelete,
  type,
}: SortableItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg group"
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      
      <div className="flex-1 flex gap-2">
        <Input
          key={`${id}-name`}
          placeholder={type === "option" ? "Size name" : "Add-on name"}
          value={name}
          onChange={(e) => onUpdate(id, "name", e.target.value)}
          className="flex-1"
        />
        <div className="flex items-center gap-1 w-32">
          <span className="text-sm text-muted-foreground">$</span>
          <Input
            key={`${id}-price`}
            type="text"
            placeholder="0.00"
            value={price.replace("$", "")}
            onChange={(e) => onUpdate(id, "price", e.target.value)}
            className="flex-1"
          />
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
});

SortableItem.displayName = "SortableItem";

// UUID validation utility
const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

// Generate temp ID for new local items
const generateTempId = () => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Diff computation helpers
const diffOptions = (initial: EditableDishOption[], current: EditableDishOption[]) => {
  const byId = new Map(initial.map(o => [o.id, o]));

  const toCreate: EditableDishOption[] = [];
  const toUpdate: EditableDishOption[] = [];
  const toDelete: EditableDishOption[] = [];

  current.forEach(opt => {
    if (opt._status === "new") {
      toCreate.push(opt);
    } else if (opt._status === "updated") {
      toUpdate.push(opt);
    }
  });

  initial.forEach(orig => {
    const now = current.find(o => o.id === orig.id);
    if (!now || now._status === "deleted") {
      toDelete.push(orig);
    }
  });

  return { toCreate, toUpdate, toDelete };
};

const diffModifiers = (initial: EditableDishModifier[], current: EditableDishModifier[]) => {
  const byId = new Map(initial.map(m => [m.id, m]));

  const toCreate: EditableDishModifier[] = [];
  const toUpdate: EditableDishModifier[] = [];
  const toDelete: EditableDishModifier[] = [];

  current.forEach(mod => {
    if (mod._status === "new") {
      toCreate.push(mod);
    } else if (mod._status === "updated") {
      toUpdate.push(mod);
    }
  });

  initial.forEach(orig => {
    const now = current.find(m => m.id === orig.id);
    if (!now || now._status === "deleted") {
      toDelete.push(orig);
    }
  });

  return { toCreate, toUpdate, toDelete };
};

export function DishOptionsEditor({
  dishId,
  dishName,
  hasOptions: initialHasOptions = false,
  subcategoryId,
  open,
  onOpenChange,
}: DishOptionsEditorProps) {
  const queryClient = useQueryClient();
  const { data: options = [], isLoading: optionsLoading } = useDishOptions(dishId);
  const { data: modifiers = [], isLoading: modifiersLoading } = useDishModifiers(dishId);

  // Use silent mutations (no toasts, no individual cache invalidation)
  const createOption = useCreateDishOptionSilent();
  const updateOption = useUpdateDishOptionSilent();
  const deleteOption = useDeleteDishOptionSilent();

  const createModifier = useCreateDishModifierSilent();
  const updateModifier = useUpdateDishModifierSilent();
  const deleteModifier = useDeleteDishModifierSilent();

  const updateDish = useUpdateDish();

  // Local editable state (pure local, instant updates)
  const [localOptions, setLocalOptions] = useState<EditableDishOption[]>([]);
  const [localModifiers, setLocalModifiers] = useState<EditableDishModifier[]>([]);
  const [localHasOptions, setLocalHasOptions] = useState(initialHasOptions);
  const [isSaving, setIsSaving] = useState(false);

  // Store initial state for diffing on save
  const initialOptionsRef = useRef<EditableDishOption[]>([]);
  const initialModifiersRef = useRef<EditableDishModifier[]>([]);
  const dialogOpenedRef = useRef(false);

  // Optimized drag sensors with iOS-like activation (requires 8px movement)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    })
  );

  // Sync local state when dialog opens
  useEffect(() => {
    if (open && !dialogOpenedRef.current) {
      const editableOptions = options.map(o => ({ ...o, _status: "unchanged" as const }));
      const editableModifiers = modifiers.map(m => ({ ...m, _status: "unchanged" as const }));
      
      setLocalOptions(editableOptions);
      setLocalModifiers(editableModifiers);
      setLocalHasOptions(initialHasOptions);

      // Deep clone for diffing
      initialOptionsRef.current = editableOptions.map(o => ({ ...o }));
      initialModifiersRef.current = editableModifiers.map(m => ({ ...m }));
      
      dialogOpenedRef.current = true;
    } else if (!open) {
      dialogOpenedRef.current = false;
    }
  }, [open, options, modifiers, initialHasOptions]);

  // Memoized instant add option (no network, pure local)
  const handleAddOption = useCallback(() => {
    const newOrderIndex = localOptions.length;
    const tempId = generateTempId();

    const tempOption: EditableDishOption = {
      id: tempId,
      dish_id: dishId,
      name: "Size",
      price: "0.00",
      order_index: newOrderIndex,
      created_at: new Date().toISOString(),
      _status: "new",
      _temp: true,
    };

    setLocalOptions(prev => [...prev, tempOption]);
  }, [localOptions.length, dishId]);

  // Memoized instant add modifier (no network, pure local)
  const handleAddModifier = useCallback(() => {
    const newOrderIndex = localModifiers.length;
    const tempId = generateTempId();

    const tempModifier: EditableDishModifier = {
      id: tempId,
      dish_id: dishId,
      name: "Add-on",
      price: "0.00",
      order_index: newOrderIndex,
      created_at: new Date().toISOString(),
      _status: "new",
      _temp: true,
    };

    setLocalModifiers(prev => [...prev, tempModifier]);
  }, [localModifiers.length, dishId]);

  // Memoized instant update option (no network, pure local)
  const handleUpdateOption = useCallback((id: string, field: "name" | "price", value: string) => {
    setLocalOptions(prev => prev.map(opt => {
      if (opt.id !== id) return opt;
      
      const updated = { ...opt, [field]: value };
      // Mark as updated if it's an existing option
      if (opt._status !== "new") {
        updated._status = "updated";
      }
      return updated;
    }));
  }, []);

  // Memoized instant update modifier (no network, pure local)
  const handleUpdateModifier = useCallback((id: string, field: "name" | "price", value: string) => {
    setLocalModifiers(prev => prev.map(mod => {
      if (mod.id !== id) return mod;
      
      const updated = { ...mod, [field]: value };
      // Mark as updated if it's an existing modifier
      if (mod._status !== "new") {
        updated._status = "updated";
      }
      return updated;
    }));
  }, []);

  // Memoized instant delete option (no network, pure local)
  const handleDeleteOption = useCallback((id: string) => {
    setLocalOptions(prev => {
      const target = prev.find(o => o.id === id);
      if (!target) return prev;

      // If new & temp, just remove it from the array
      if (target._status === "new" || target._temp) {
        return prev.filter(o => o.id !== id);
      }

      // Otherwise, mark as deleted (we'll persist on commit)
      return prev.map(o =>
        o.id === id ? { ...o, _status: "deleted" as const } : o
      );
    });
  }, []);

  // Memoized instant delete modifier (no network, pure local)
  const handleDeleteModifier = useCallback((id: string) => {
    setLocalModifiers(prev => {
      const target = prev.find(m => m.id === id);
      if (!target) return prev;

      // If new & temp, just remove it from the array
      if (target._status === "new" || target._temp) {
        return prev.filter(m => m.id !== id);
      }

      // Otherwise, mark as deleted (we'll persist on commit)
      return prev.map(m =>
        m.id === id ? { ...m, _status: "deleted" as const } : m
      );
    });
  }, []);

  // Instant smooth drag end for options (no network, pure local)
  const handleOptionDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setLocalOptions(prev => {
      const oldIndex = prev.findIndex(o => o.id === active.id);
      const newIndex = prev.findIndex(o => o.id === over.id);
      const reordered = arrayMove(prev, oldIndex, newIndex).map((opt, idx) => ({
        ...opt,
        order_index: idx,
        _status: opt._status === "new" ? "new" as const : "updated" as const,
      }));
      return reordered;
    });
  }, []);

  // Instant smooth drag end for modifiers (no network, pure local)
  const handleModifierDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setLocalModifiers(prev => {
      const oldIndex = prev.findIndex(m => m.id === active.id);
      const newIndex = prev.findIndex(m => m.id === over.id);
      const reordered = arrayMove(prev, oldIndex, newIndex).map((mod, idx) => ({
        ...mod,
        order_index: idx,
        _status: mod._status === "new" ? "new" as const : "updated" as const,
      }));
      return reordered;
    });
  }, []);

  // Resolve dish ID helper - ensures we never save with temp IDs
  const resolveDishId = useCallback(async (): Promise<string | null> => {
    if (isUuid(dishId)) return dishId;

    // Fallback: look up the real dish row in the DB
    const { data, error } = await supabase
      .from("dishes")
      .select("id, name, subcategory_id")
      .eq("subcategory_id", subcategoryId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      console.warn("❌ Could not resolve dish ID:", { dishId, subcategoryId, error });
      return null;
    }
    
    console.log("✅ Resolved dish ID:", data.id);
    return data.id;
  }, [dishId, subcategoryId]);

  // Retry helper for transient errors
  const runWithRetry = async <T,>(fn: () => Promise<T>, operationName: string): Promise<T> => {
    let lastError: any;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await fn();
      } catch (err: any) {
        lastError = err;
        console.warn(`⚠️ ${operationName} attempt ${attempt + 1} failed:`, err);
        
        // If error is clearly non-retryable (e.g., permission denied), break early
        if (err?.code === "42501" || err?.code === "PGRST301") {
          console.error(`❌ Non-retryable error for ${operationName}:`, err);
          break;
        }
        
        // Exponential backoff
        await new Promise(r => setTimeout(r, 100 * (attempt + 1)));
      }
    }
    throw lastError;
  };

  // Instant toggle has_options on the dish (optimistic update with fail-proof ID resolution)
  const handleToggleHasOptions = useCallback(async (enabled: boolean) => {
    const originalValue = localHasOptions;
    setLocalHasOptions(enabled);
    
    try {
      // Resolve dish ID first
      const resolvedDishId = await resolveDishId();
      
      if (!resolvedDishId) {
        console.warn("❌ Cannot toggle has_options: dish is still saving");
        toast.info("This dish is still saving. Please wait a moment and try again.");
        setLocalHasOptions(originalValue);
        return;
      }
      
      // Optimistic cache update
      queryClient.setQueryData(["dishes"], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((dish: any) => 
          dish.id === resolvedDishId ? { ...dish, has_options: enabled } : dish
        );
      });
      
      await updateDish.mutateAsync({
        id: resolvedDishId,
        updates: { has_options: enabled },
      });
    } catch (error) {
      console.error("❌ Failed to toggle has_options:", error);
      setLocalHasOptions(originalValue);
      toast.error("Failed to update pricing options setting");
    }
  }, [dishId, subcategoryId, localHasOptions, updateDish, queryClient, resolveDishId]);

  // FAIL-PROOF commit engine with ID resolution, retries, and error handling
  const handleSaveAndClose = useCallback(async () => {
    if (isSaving) return; // Prevent double-saves
    
    console.log("🚀 Starting save process...", { dishId, subcategoryId });
    setIsSaving(true);

    try {
      // STEP 1: Resolve dish ID (CRITICAL - prevents UUID errors)
      const resolvedDishId = await resolveDishId();
      
      if (!resolvedDishId) {
        console.warn("❌ Save blocked: dish is still being created");
        toast.info("This dish is still saving. Please wait a couple seconds and try again.");
        setIsSaving(false);
        return;
      }

      console.log("✅ Using resolved dish ID:", resolvedDishId);

      // STEP 2: Calculate diffs
      const { toCreate: newOptions, toUpdate: updatedOptions, toDelete: deletedOptions } = diffOptions(
        initialOptionsRef.current,
        localOptions
      );

      const { toCreate: newModifiers, toUpdate: updatedModifiers, toDelete: deletedModifiers } = diffModifiers(
        initialModifiersRef.current,
        localModifiers
      );

      console.log("📊 Changes detected:", {
        newOptions: newOptions.length,
        updatedOptions: updatedOptions.length,
        deletedOptions: deletedOptions.length,
        newModifiers: newModifiers.length,
        updatedModifiers: updatedModifiers.length,
        deletedModifiers: deletedModifiers.length,
      });

      // STEP 3: Normalize all prices client-side for instant feedback
      const normalizedNewOptions = newOptions.map(opt => ({
        ...opt,
        price: normalizePrice(opt.price),
      }));
      const normalizedUpdatedOptions = updatedOptions.map(opt => ({
        ...opt,
        price: normalizePrice(opt.price),
      }));
      const normalizedNewModifiers = newModifiers.map(mod => ({
        ...mod,
        price: normalizePrice(mod.price),
      }));
      const normalizedUpdatedModifiers = updatedModifiers.map(mod => ({
        ...mod,
        price: normalizePrice(mod.price),
      }));

      // STEP 4: INSTANT optimistic cache update (preview & live update immediately)
      queryClient.setQueryData(["dish-options", resolvedDishId], localOptions.filter(o => o._status !== "deleted"));
      queryClient.setQueryData(["dish-modifiers", resolvedDishId], localModifiers.filter(m => m._status !== "deleted"));

      // STEP 5: TRUE PARALLEL EXECUTION with retries
      const tasks = [
        // Create all new items
        ...normalizedNewOptions.map((opt, idx) =>
          runWithRetry(
            () => createOption.mutateAsync({
              dish_id: resolvedDishId,
              name: opt.name,
              price: opt.price,
              order_index: opt.order_index,
            }),
            `createOption-${idx}`
          )
        ),
        ...normalizedNewModifiers.map((mod, idx) =>
          runWithRetry(
            () => createModifier.mutateAsync({
              dish_id: resolvedDishId,
              name: mod.name,
              price: mod.price,
              order_index: mod.order_index,
            }),
            `createModifier-${idx}`
          )
        ),
        // Update all existing items
        ...normalizedUpdatedOptions.map((opt, idx) =>
          runWithRetry(
            () => updateOption.mutateAsync({
              id: opt.id,
              updates: {
                name: opt.name,
                price: opt.price,
                order_index: opt.order_index,
              },
            }),
            `updateOption-${idx}`
          )
        ),
        ...normalizedUpdatedModifiers.map((mod, idx) =>
          runWithRetry(
            () => updateModifier.mutateAsync({
              id: mod.id,
              updates: {
                name: mod.name,
                price: mod.price,
                order_index: mod.order_index,
              },
            }),
            `updateModifier-${idx}`
          )
        ),
        // Delete all removed items
        ...deletedOptions.map((opt, idx) =>
          runWithRetry(
            () => deleteOption.mutateAsync({ id: opt.id, dishId: resolvedDishId }),
            `deleteOption-${idx}`
          )
        ),
        ...deletedModifiers.map((mod, idx) =>
          runWithRetry(
            () => deleteModifier.mutateAsync({ id: mod.id, dishId: resolvedDishId }),
            `deleteModifier-${idx}`
          )
        ),
      ];

      // Use Promise.allSettled to inspect failures instead of failing fast
      const results = await Promise.allSettled(tasks);
      const failed = results.filter(r => r.status === "rejected") as PromiseRejectedResult[];

      if (failed.length > 0) {
        console.error("❌ Some operations failed:", failed);
        throw new Error(`${failed.length} pricing change(s) could not be saved`);
      }

      console.log("✅ All mutations succeeded");

      // STEP 6: SINGLE cache invalidation (20x faster than 60+ invalidations)
      await invalidateAllCaches(resolvedDishId, queryClient);

      // Single success toast (no spam)
      toast.success("Pricing options saved");

      onOpenChange(false);
    } catch (error: any) {
      console.error("❌ Save failed:", error);
      
      // Enhanced error messages based on error type
      if (error?.code === "42501" || error?.code === "PGRST301") {
        toast.error("You don't have permission to edit pricing for this dish");
      } else if (error?.message?.includes("Failed to fetch") || error?.name === "TypeError") {
        toast.error("You're offline or the connection is unstable. Changes couldn't be saved.");
      } else if (error?.code === "22P02") {
        toast.error("Invalid data format. Please refresh the page and try again.");
      } else {
        toast.error(error?.message || "Failed to save changes");
      }
      
      // Re-fetch data to realign UI with database
      const resolvedDishId = await resolveDishId();
      if (resolvedDishId) {
        await Promise.all([
          queryClient.refetchQueries({ queryKey: ["dish-options", resolvedDishId] }),
          queryClient.refetchQueries({ queryKey: ["dish-modifiers", resolvedDishId] }),
        ]);
      }
    } finally {
      setIsSaving(false);
    }
  }, [
    isSaving,
    localOptions, 
    localModifiers, 
    dishId,
    subcategoryId,
    createOption, 
    updateOption, 
    deleteOption,
    createModifier,
    updateModifier,
    deleteModifier,
    queryClient,
    onOpenChange,
    resolveDishId
  ]);

  // Filter out deleted items for rendering
  const visibleOptions = localOptions.filter(o => o._status !== "deleted");
  const visibleModifiers = localModifiers.filter(m => m._status !== "deleted");

  if (optionsLoading || modifiersLoading) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pricing Options for {dishName}</DialogTitle>
          <DialogDescription>
            Add size options and modifiers to give customers more choices.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Enable Pricing Options Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="enable-options" className="text-base">
                Enable Pricing Options
              </Label>
              <p className="text-sm text-muted-foreground">
                Allow customers to choose sizes and add modifiers
              </p>
            </div>
            <Switch
              id="enable-options"
              checked={localHasOptions}
              onCheckedChange={handleToggleHasOptions}
            />
          </div>

          {/* Size Options Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Size Options</Label>
                <p className="text-sm text-muted-foreground">Different sizes or types</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddOption}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Size
              </Button>
            </div>

            {visibleOptions.length > 0 && (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleOptionDragEnd}
              >
                <SortableContext
                  items={visibleOptions.map(o => o.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {visibleOptions.map(option => (
                      <SortableItem
                        key={option.id}
                        id={option.id}
                        name={option.name}
                        price={option.price}
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

          {/* Add-ons/Modifiers Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Add-ons & Modifiers</Label>
                <p className="text-sm text-muted-foreground">Extra toppings or upgrades</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddModifier}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Modifier
              </Button>
            </div>

            {visibleModifiers.length > 0 && (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleModifierDragEnd}
              >
                <SortableContext
                  items={visibleModifiers.map(m => m.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {visibleModifiers.map(modifier => (
                      <SortableItem
                        key={modifier.id}
                        id={modifier.id}
                        name={modifier.name}
                        price={modifier.price}
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

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveAndClose}
              disabled={isSaving}
              style={{ opacity: isSaving ? 0.6 : 1 }}
            >
              {isSaving ? "Saving..." : "Save & Close"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
