import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, GripVertical, X } from "lucide-react";
import { useUpdateDish } from "@/hooks/useDishes";
import { 
  useDishOptions, 
  useCreateDishOption, 
  useUpdateDishOption, 
  useDeleteDishOption 
} from "@/hooks/useDishOptions";
import { 
  useDishModifiers, 
  useCreateDishModifier, 
  useUpdateDishModifier, 
  useDeleteDishModifier 
} from "@/hooks/useDishModifiers";
import { generateTempId } from "@/lib/utils/uuid";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors, closestCenter } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface DishOptionsEditorProps {
  dishId: string;
  dishName: string;
  hasOptions: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Editable types with local metadata
interface EditableDishOption {
  id: string;
  dish_id: string;
  name: string;
  price: string;
  order_index: number;
  created_at: string | null;
  _status?: "new" | "updated" | "deleted" | "unchanged";
  _temp?: boolean;
}

interface EditableDishModifier {
  id: string;
  dish_id: string;
  name: string;
  price: string;
  order_index: number;
  created_at: string | null;
  _status?: "new" | "updated" | "deleted" | "unchanged";
  _temp?: boolean;
}

interface SortableItemProps {
  id: string;
  name: string;
  price: string;
  onUpdate: (field: "name" | "price", value: string) => void;
  onDelete: () => void;
}

const SortableItem = ({ id, name, price, onUpdate, onDelete }: SortableItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 mb-2">
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      
      <Input
        value={name}
        onChange={(e) => onUpdate("name", e.target.value)}
        placeholder="Option name"
        className="flex-1"
      />
      
      <Input
        type="text"
        inputMode="decimal"
        value={price}
        onChange={(e) => onUpdate("price", e.target.value)}
        placeholder="0.00"
        className="w-24"
      />
      
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onDelete}
        className="flex-shrink-0"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};

export const DishOptionsEditor = ({ dishId, dishName, hasOptions, open, onOpenChange }: DishOptionsEditorProps) => {
  // Fetch data
  const { data: options = [] } = useDishOptions(dishId);
  const { data: modifiers = [] } = useDishModifiers(dishId);
  
  // Mutation hooks
  const updateDish = useUpdateDish();
  const createOption = useCreateDishOption();
  const updateOption = useUpdateDishOption();
  const deleteOption = useDeleteDishOption();
  const createModifier = useCreateDishModifier();
  const updateModifier = useUpdateDishModifier();
  const deleteModifier = useDeleteDishModifier();

  // Local editable state
  const [localOptions, setLocalOptions] = useState<EditableDishOption[]>([]);
  const [localModifiers, setLocalModifiers] = useState<EditableDishModifier[]>([]);
  const [localHasOptions, setLocalHasOptions] = useState(hasOptions);
  const [isSaving, setIsSaving] = useState(false);

  // Track initial state for diffing
  const initialOptionsRef = useRef<EditableDishOption[]>([]);
  const initialModifiersRef = useRef<EditableDishModifier[]>([]);
  const initialHasOptionsRef = useRef(hasOptions);
  const dialogOpenedRef = useRef(false);

  // Drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // Initialize local state when dialog opens
  useEffect(() => {
    if (open && !dialogOpenedRef.current) {
      const editableOptions: EditableDishOption[] = options.map(o => ({ 
        ...o, 
        _status: "unchanged" as const 
      }));
      const editableModifiers: EditableDishModifier[] = modifiers.map(m => ({ 
        ...m, 
        _status: "unchanged" as const 
      }));
      
      setLocalOptions(editableOptions);
      setLocalModifiers(editableModifiers);
      setLocalHasOptions(hasOptions);
      
      // Deep clone for diffing
      initialOptionsRef.current = editableOptions.map(o => ({ ...o }));
      initialModifiersRef.current = editableModifiers.map(m => ({ ...m }));
      initialHasOptionsRef.current = hasOptions;
      
      dialogOpenedRef.current = true;
    } else if (!open) {
      dialogOpenedRef.current = false;
    }
  }, [open, options, modifiers, hasOptions]);

  // ========== PURE LOCAL OPERATIONS (INSTANT) ==========

  const markOptionUpdated = (opt: EditableDishOption): EditableDishOption => {
    if (opt._status === "new") return opt;
    return { ...opt, _status: "updated" };
  };

  const markModifierUpdated = (mod: EditableDishModifier): EditableDishModifier => {
    if (mod._status === "new") return mod;
    return { ...mod, _status: "updated" };
  };

  const handleAddOption = () => {
    const newOrderIndex = localOptions.filter(o => o._status !== "deleted").length;
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
  };

  const handleUpdateOption = (id: string, field: "name" | "price", value: string) => {
    setLocalOptions(prev => prev.map(opt =>
      opt.id === id ? markOptionUpdated({ ...opt, [field]: value }) : opt
    ));
  };

  const handleDeleteOption = (id: string) => {
    setLocalOptions(prev => {
      const target = prev.find(o => o.id === id);
      if (!target) return prev;

      // If new & temp, just remove from array
      if (target._status === "new" || target._temp) {
        return prev.filter(o => o.id !== id);
      }

      // Otherwise mark as deleted (will persist on commit)
      return prev.map(o => o.id === id ? { ...o, _status: "deleted" as const } : o);
    });
  };

  const handleAddModifier = () => {
    const newOrderIndex = localModifiers.filter(m => m._status !== "deleted").length;
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
  };

  const handleUpdateModifier = (id: string, field: "name" | "price", value: string) => {
    setLocalModifiers(prev => prev.map(mod =>
      mod.id === id ? markModifierUpdated({ ...mod, [field]: value }) : mod
    ));
  };

  const handleDeleteModifier = (id: string) => {
    setLocalModifiers(prev => {
      const target = prev.find(m => m.id === id);
      if (!target) return prev;

      if (target._status === "new" || target._temp) {
        return prev.filter(m => m.id !== id);
      }

      return prev.map(m => m.id === id ? { ...m, _status: "deleted" as const } : m);
    });
  };

  const handleOptionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setLocalOptions(prev => {
      const visibleOptions = prev.filter(o => o._status !== "deleted");
      const oldIndex = visibleOptions.findIndex(o => o.id === active.id);
      const newIndex = visibleOptions.findIndex(o => o.id === over.id);
      
      const reordered = arrayMove(visibleOptions, oldIndex, newIndex).map((opt, idx) => ({
        ...opt,
        order_index: idx,
        _status: opt._status === "new" ? "new" as const : "updated" as const,
      }));

      // Merge back deleted items
      const deleted = prev.filter(o => o._status === "deleted");
      return [...reordered, ...deleted];
    });
  };

  const handleModifierDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setLocalModifiers(prev => {
      const visibleModifiers = prev.filter(m => m._status !== "deleted");
      const oldIndex = visibleModifiers.findIndex(m => m.id === active.id);
      const newIndex = visibleModifiers.findIndex(m => m.id === over.id);
      
      const reordered = arrayMove(visibleModifiers, oldIndex, newIndex).map((mod, idx) => ({
        ...mod,
        order_index: idx,
        _status: mod._status === "new" ? "new" as const : "updated" as const,
      }));

      const deleted = prev.filter(m => m._status === "deleted");
      return [...reordered, ...deleted];
    });
  };

  const handleToggleHasOptions = (checked: boolean) => {
    setLocalHasOptions(checked);
  };

  // ========== DIFF COMPUTATION ==========

  const diffOptions = (initial: EditableDishOption[], current: EditableDishOption[]) => {
    const toCreate: EditableDishOption[] = [];
    const toUpdate: EditableDishOption[] = [];
    const toDelete: EditableDishOption[] = [];

    current.forEach(opt => {
      if (opt._status === "new") {
        toCreate.push(opt);
      } else if (opt._status === "updated") {
        toUpdate.push(opt);
      } else if (opt._status === "deleted") {
        toDelete.push(opt);
      }
    });

    // Find items that existed before but are now missing (deleted)
    initial.forEach(orig => {
      const now = current.find(o => o.id === orig.id);
      if (!now || now._status === "deleted") {
        if (!toDelete.find(d => d.id === orig.id)) {
          toDelete.push(orig);
        }
      }
    });

    return { toCreate, toUpdate, toDelete };
  };

  const diffModifiers = (initial: EditableDishModifier[], current: EditableDishModifier[]) => {
    const toCreate: EditableDishModifier[] = [];
    const toUpdate: EditableDishModifier[] = [];
    const toDelete: EditableDishModifier[] = [];

    current.forEach(mod => {
      if (mod._status === "new") {
        toCreate.push(mod);
      } else if (mod._status === "updated") {
        toUpdate.push(mod);
      } else if (mod._status === "deleted") {
        toDelete.push(mod);
      }
    });

    initial.forEach(orig => {
      const now = current.find(m => m.id === orig.id);
      if (!now || now._status === "deleted") {
        if (!toDelete.find(d => d.id === orig.id)) {
          toDelete.push(orig);
        }
      }
    });

    return { toCreate, toUpdate, toDelete };
  };

  // ========== COMMIT ENGINE ==========

  const handleSaveAndClose = async () => {
    setIsSaving(true);

    try {
      // 1. Update has_options if changed
      if (localHasOptions !== initialHasOptionsRef.current) {
        await updateDish.mutateAsync({
          id: dishId,
          updates: { has_options: localHasOptions },
        });
      }

      const { toCreate: newOptions, toUpdate: updatedOptions, toDelete: deletedOptions } =
        diffOptions(initialOptionsRef.current, localOptions);

      const { toCreate: newModifiers, toUpdate: updatedModifiers, toDelete: deletedModifiers } =
        diffModifiers(initialModifiersRef.current, localModifiers);

      // 2. Create new options/modifiers
      await Promise.all([
        ...newOptions.map(opt =>
          createOption.mutateAsync({
            dish_id: dishId,
            name: opt.name,
            price: opt.price,
            order_index: opt.order_index,
          })
        ),
        ...newModifiers.map(mod =>
          createModifier.mutateAsync({
            dish_id: dishId,
            name: mod.name,
            price: mod.price,
            order_index: mod.order_index,
          })
        ),
      ]);

      // 3. Update existing ones
      await Promise.all([
        ...updatedOptions.map(opt =>
          updateOption.mutateAsync({
            id: opt.id,
            updates: {
              name: opt.name,
              price: opt.price,
              order_index: opt.order_index,
            },
          })
        ),
        ...updatedModifiers.map(mod =>
          updateModifier.mutateAsync({
            id: mod.id,
            updates: {
              name: mod.name,
              price: mod.price,
              order_index: mod.order_index,
            },
          })
        ),
      ]);

      // 4. Delete removed ones
      await Promise.all([
        ...deletedOptions.map(opt =>
          deleteOption.mutateAsync({ id: opt.id, dishId })
        ),
        ...deletedModifiers.map(mod =>
          deleteModifier.mutateAsync({ id: mod.id, dishId })
        ),
      ]);

      // Close dialog after successful commit
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save pricing options:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Visible items (exclude deleted)
  const visibleOptions = localOptions.filter(o => o._status !== "deleted");
  const visibleModifiers = localModifiers.filter(m => m._status !== "deleted");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pricing Options - {dishName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Toggle Enable Options */}
          <div className="flex items-center justify-between">
            <Label htmlFor="enable-options" className="text-base font-medium">
              Enable Pricing Options
            </Label>
            <Switch
              id="enable-options"
              checked={localHasOptions}
              onCheckedChange={handleToggleHasOptions}
            />
          </div>

          {localHasOptions && (
            <>
              {/* Size/Type Options */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Size / Type Options</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddOption}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Option
                  </Button>
                </div>

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
                          onUpdate={(field, value) => handleUpdateOption(option.id, field, value)}
                          onDelete={() => handleDeleteOption(option.id)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>

                {visibleOptions.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No options yet. Add options like Small, Medium, Large with different prices.
                  </p>
                )}
              </div>

              {/* Add-ons / Modifiers */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Add-ons / Modifiers</Label>
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
                          onUpdate={(field, value) => handleUpdateModifier(modifier.id, field, value)}
                          onDelete={() => handleDeleteModifier(modifier.id)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>

                {visibleModifiers.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No modifiers yet. Add optional extras that customers can add for an additional price.
                  </p>
                )}
              </div>
            </>
          )}

          {/* Save & Close Button */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveAndClose}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save & Close"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
