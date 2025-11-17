import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, GripVertical, Loader2 } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDishOptions, useCreateDishOption, useUpdateDishOption, useDeleteDishOption, useUpdateDishOptionsOrder, DishOption } from "@/hooks/useDishOptions";
import { useDishModifiers, useCreateDishModifier, useUpdateDishModifier, useDeleteDishModifier, useUpdateDishModifiersOrder, DishModifier } from "@/hooks/useDishModifiers";
import { useUpdateDish } from "@/hooks/useDishes";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { generateTempId } from "@/lib/utils/uuid";

interface DishOptionsEditorProps {
  dishId: string;
  dishName: string;
  hasOptions: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SortableItemProps {
  id: string;
  name: string;
  price: string;
  onUpdate: (id: string, field: "name" | "price", value: string) => void;
  onDelete: (id: string) => void;
  isSaving?: boolean;
}

const SortableItem = ({ id, name, price, onUpdate, onDelete, isSaving }: SortableItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border border-border relative">
      {isSaving && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-lg z-10">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        </div>
      )}
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <Input
        value={name}
        onChange={(e) => onUpdate(id, "name", e.target.value)}
        placeholder="Name"
        className="flex-1"
      />
      <Input
        value={price}
        onChange={(e) => onUpdate(id, "price", e.target.value)}
        placeholder="$0.00"
        className="w-24"
      />
      <Button variant="ghost" size="icon" onClick={() => onDelete(id)}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
};

export const DishOptionsEditor = ({ dishId, dishName, hasOptions, open, onOpenChange }: DishOptionsEditorProps) => {
  const queryClient = useQueryClient();
  const { data: options = [] } = useDishOptions(dishId);
  const { data: modifiers = [] } = useDishModifiers(dishId);
  
  const createOption = useCreateDishOption();
  const updateOption = useUpdateDishOption();
  const deleteOption = useDeleteDishOption();
  const updateOptionsOrder = useUpdateDishOptionsOrder();
  
  const createModifier = useCreateDishModifier();
  const updateModifier = useUpdateDishModifier();
  const deleteModifier = useDeleteDishModifier();
  const updateModifiersOrder = useUpdateDishModifiersOrder();
  
  const updateDish = useUpdateDish();
  
  const [localOptions, setLocalOptions] = useState<DishOption[]>([]);
  const [localModifiers, setLocalModifiers] = useState<DishModifier[]>([]);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const updateTimers = useRef<{ [key: string]: any }>({});
  
  // Sync when dialog opens or data changes
  useEffect(() => {
    if (open) {
      setLocalOptions(options);
      setLocalModifiers(modifiers);
    }
  }, [open, options, modifiers]);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleToggleOptions = async (enabled: boolean) => {
    updateDish.mutate({
      id: dishId,
      updates: { has_options: enabled },
    });
    
    // Invalidate full menu cache immediately
    const { data: dish } = await supabase
      .from("dishes")
      .select(`
        subcategory_id,
        subcategories!inner(
          category_id,
          categories!inner(restaurant_id)
        )
      `)
      .eq("id", dishId)
      .single();

    if (dish?.subcategories?.categories?.restaurant_id) {
      const restaurantId = dish.subcategories.categories.restaurant_id;
      queryClient.invalidateQueries({ queryKey: ["full-menu", restaurantId] });
      localStorage.removeItem(`fullMenu:${restaurantId}`);
    }
  };

  // Debounced update function
  const debouncedUpdate = useCallback((
    id: string,
    field: "name" | "price",
    value: string,
    type: "option" | "modifier"
  ) => {
    const timerKey = `${type}-${id}-${field}`;
    if (updateTimers.current[timerKey]) {
      clearTimeout(updateTimers.current[timerKey]);
    }

    setSavingIds(prev => new Set(prev).add(id));

    updateTimers.current[timerKey] = setTimeout(() => {
      if (type === "option") {
        updateOption.mutate(
          { id, updates: { [field]: value } },
          {
            onSettled: () => {
              setSavingIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
              });
            }
          }
        );
      } else {
        updateModifier.mutate(
          { id, updates: { [field]: value } },
          {
            onSettled: () => {
              setSavingIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
              });
            }
          }
        );
      }
      delete updateTimers.current[timerKey];
    }, 300);
  }, [updateOption, updateModifier]);

  const handleAddOption = () => {
    const newOrderIndex = localOptions.length;
    const tempId = generateTempId();
    const tempOption: DishOption = {
      id: tempId,
      dish_id: dishId,
      name: "Size",
      price: "0.00",
      order_index: newOrderIndex,
      created_at: new Date().toISOString(),
    };
    setLocalOptions([...localOptions, tempOption]);
    createOption.mutate({
      dish_id: dishId,
      name: "Size",
      price: "0.00",
      order_index: newOrderIndex,
    });
  };

  const handleUpdateOption = (id: string, field: "name" | "price", value: string) => {
    setLocalOptions(localOptions.map(opt => 
      opt.id === id ? { ...opt, [field]: value } : opt
    ));
    
    if (!id.startsWith("temp-")) {
      debouncedUpdate(id, field, value, "option");
    }
  };

  const handleDeleteOption = (id: string) => {
    setLocalOptions(localOptions.filter(opt => opt.id !== id));
    if (!id.startsWith("temp-")) {
      deleteOption.mutate({ id, dishId });
    }
  };

  const handleOptionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localOptions.findIndex((opt) => opt.id === active.id);
    const newIndex = localOptions.findIndex((opt) => opt.id === over.id);

    const reordered = arrayMove(localOptions, oldIndex, newIndex).map((opt, idx) => ({
      ...opt,
      order_index: idx,
    }));

    setLocalOptions(reordered);
    
    const realOptions = reordered.filter(opt => !opt.id.startsWith("temp-"));
    if (realOptions.length > 0) {
      updateOptionsOrder.mutate({ options: realOptions, dishId });
    }
  };

  const handleAddModifier = () => {
    const newOrderIndex = localModifiers.length;
    const tempId = generateTempId();
    const tempModifier: DishModifier = {
      id: tempId,
      dish_id: dishId,
      name: "Add-on",
      price: "0.00",
      order_index: newOrderIndex,
      created_at: new Date().toISOString(),
    };
    setLocalModifiers([...localModifiers, tempModifier]);
    createModifier.mutate({
      dish_id: dishId,
      name: "Add-on",
      price: "0.00",
      order_index: newOrderIndex,
    });
  };

  const handleUpdateModifier = (id: string, field: "name" | "price", value: string) => {
    setLocalModifiers(localModifiers.map(mod => 
      mod.id === id ? { ...mod, [field]: value } : mod
    ));
    
    if (!id.startsWith("temp-")) {
      debouncedUpdate(id, field, value, "modifier");
    }
  };

  const handleDeleteModifier = (id: string) => {
    setLocalModifiers(localModifiers.filter(mod => mod.id !== id));
    if (!id.startsWith("temp-")) {
      deleteModifier.mutate({ id, dishId });
    }
  };

  const handleModifierDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localModifiers.findIndex((mod) => mod.id === active.id);
    const newIndex = localModifiers.findIndex((mod) => mod.id === over.id);

    const reordered = arrayMove(localModifiers, oldIndex, newIndex).map((mod, idx) => ({
      ...mod,
      order_index: idx,
    }));

    setLocalModifiers(reordered);
    
    const realModifiers = reordered.filter(mod => !mod.id.startsWith("temp-"));
    if (realModifiers.length > 0) {
      updateModifiersOrder.mutate({ modifiers: realModifiers, dishId });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pricing Options - {dishName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Enable Options Toggle */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div>
              <Label className="text-base font-semibold">Enable Pricing Options</Label>
              <p className="text-sm text-muted-foreground">Allow customers to choose sizes or variations</p>
            </div>
            <Switch
              checked={hasOptions}
              onCheckedChange={handleToggleOptions}
            />
          </div>

          {hasOptions && (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Size/Type Options</Label>
                  <Button onClick={handleAddOption} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Option
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">Different sizes or variants (e.g., Small, Medium, Large)</p>
                
                {localOptions.length > 0 ? (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleOptionDragEnd}>
                    <SortableContext items={localOptions.map(o => o.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-2">
                        {localOptions.map((option) => (
                          <SortableItem
                            key={option.id}
                            id={option.id}
                            name={option.name}
                            price={option.price}
                            onUpdate={handleUpdateOption}
                            onDelete={handleDeleteOption}
                            isSaving={savingIds.has(option.id)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No options added yet</p>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Add-ons / Modifiers</Label>
                  <Button onClick={handleAddModifier} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Modifier
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">Optional extras (e.g., Cheese, Egg, Avocado)</p>
                
                {localModifiers.length > 0 ? (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleModifierDragEnd}>
                    <SortableContext items={localModifiers.map(m => m.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-2">
                        {localModifiers.map((modifier) => (
                          <SortableItem
                            key={modifier.id}
                            id={modifier.id}
                            name={modifier.name}
                            price={modifier.price}
                            onUpdate={handleUpdateModifier}
                            onDelete={handleDeleteModifier}
                            isSaving={savingIds.has(modifier.id)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No modifiers added yet</p>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
