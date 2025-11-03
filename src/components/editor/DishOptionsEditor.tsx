import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, GripVertical } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDishOptions, useCreateDishOption, useUpdateDishOption, useDeleteDishOption, useUpdateDishOptionsOrder, DishOption } from "@/hooks/useDishOptions";
import { useDishModifiers, useCreateDishModifier, useUpdateDishModifier, useDeleteDishModifier, useUpdateDishModifiersOrder, DishModifier } from "@/hooks/useDishModifiers";
import { useUpdateDish } from "@/hooks/useDishes";
import { toast } from "sonner";
import { useDebouncedCallback } from "use-debounce";

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
  isPending?: boolean;
}

const SortableItem = ({ id, name, price, onUpdate, onDelete, isPending }: SortableItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const [localName, setLocalName] = useState(name);
  const [localPrice, setLocalPrice] = useState(price);

  useEffect(() => {
    setLocalName(name);
    setLocalPrice(price);
  }, [name, price]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isPending ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border border-border">
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing touch-none">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <Input
        value={localName}
        onChange={(e) => {
          setLocalName(e.target.value);
          onUpdate(id, "name", e.target.value);
        }}
        placeholder="Name"
        className="flex-1"
        disabled={isPending}
      />
      <Input
        value={localPrice}
        onChange={(e) => {
          setLocalPrice(e.target.value);
          onUpdate(id, "price", e.target.value);
        }}
        placeholder="$0.00"
        className="w-24"
        disabled={isPending}
      />
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => onDelete(id)}
        disabled={isPending}
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
};

export const DishOptionsEditor = ({ dishId, dishName, hasOptions, open, onOpenChange }: DishOptionsEditorProps) => {
  const { data: options = [], isLoading: optionsLoading } = useDishOptions(dishId);
  const { data: modifiers = [], isLoading: modifiersLoading } = useDishModifiers(dishId);
  
  const createOption = useCreateDishOption();
  const updateOption = useUpdateDishOption();
  const deleteOption = useDeleteDishOption();
  const updateOptionsOrder = useUpdateDishOptionsOrder();
  
  const createModifier = useCreateDishModifier();
  const updateModifier = useUpdateDishModifier();
  const deleteModifier = useDeleteDishModifier();
  const updateModifiersOrder = useUpdateDishModifiersOrder();
  
  const updateDish = useUpdateDish();
  
  const [pendingUpdates, setPendingUpdates] = useState<Set<string>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleToggleOptions = async (enabled: boolean) => {
    try {
      await updateDish.mutateAsync({
        id: dishId,
        updates: { has_options: enabled },
      });
      toast.success(enabled ? "Pricing options enabled" : "Pricing options disabled");
    } catch (error) {
      toast.error("Failed to toggle pricing options");
    }
  };

  const handleAddOption = async () => {
    try {
      const newOrderIndex = options.length;
      await createOption.mutateAsync({
        dish_id: dishId,
        name: "",
        price: "0.00",
        order_index: newOrderIndex,
      });
    } catch (error) {
      toast.error("Failed to add option");
    }
  };

  const debouncedUpdateOption = useDebouncedCallback(
    async (id: string, field: "name" | "price", value: string) => {
      setPendingUpdates(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      
      try {
        await updateOption.mutateAsync({
          id,
          updates: { [field]: value },
        });
      } catch (error) {
        toast.error(`Failed to update ${field}`);
      }
    },
    500
  );

  const handleUpdateOption = useCallback((id: string, field: "name" | "price", value: string) => {
    setPendingUpdates(prev => new Set(prev).add(id));
    debouncedUpdateOption(id, field, value);
  }, [debouncedUpdateOption]);

  const handleDeleteOption = async (id: string) => {
    try {
      await deleteOption.mutateAsync({ id, dishId });
    } catch (error) {
      toast.error("Failed to delete option");
    }
  };

  const handleOptionDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = options.findIndex((opt) => opt.id === active.id);
    const newIndex = options.findIndex((opt) => opt.id === over.id);

    const reordered = arrayMove(options, oldIndex, newIndex).map((opt, idx) => ({
      ...opt,
      order_index: idx,
    }));

    updateOptionsOrder.mutate({ options: reordered, dishId });
  }, [options, dishId, updateOptionsOrder]);

  const handleAddModifier = async () => {
    try {
      const newOrderIndex = modifiers.length;
      await createModifier.mutateAsync({
        dish_id: dishId,
        name: "",
        price: "0.00",
        order_index: newOrderIndex,
      });
    } catch (error) {
      toast.error("Failed to add modifier");
    }
  };

  const debouncedUpdateModifier = useDebouncedCallback(
    async (id: string, field: "name" | "price", value: string) => {
      setPendingUpdates(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      
      try {
        await updateModifier.mutateAsync({
          id,
          updates: { [field]: value },
        });
      } catch (error) {
        toast.error(`Failed to update ${field}`);
      }
    },
    500
  );

  const handleUpdateModifier = useCallback((id: string, field: "name" | "price", value: string) => {
    setPendingUpdates(prev => new Set(prev).add(id));
    debouncedUpdateModifier(id, field, value);
  }, [debouncedUpdateModifier]);

  const handleDeleteModifier = async (id: string) => {
    try {
      await deleteModifier.mutateAsync({ id, dishId });
    } catch (error) {
      toast.error("Failed to delete modifier");
    }
  };

  const handleModifierDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = modifiers.findIndex((mod) => mod.id === active.id);
    const newIndex = modifiers.findIndex((mod) => mod.id === over.id);

    const reordered = arrayMove(modifiers, oldIndex, newIndex).map((mod, idx) => ({
      ...mod,
      order_index: idx,
    }));

    updateModifiersOrder.mutate({ modifiers: reordered, dishId });
  }, [modifiers, dishId, updateModifiersOrder]);

  const isLoading = optionsLoading || modifiersLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pricing Options: {dishName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div>
              <Label htmlFor="enable-options" className="text-base font-semibold">Enable Pricing Options</Label>
              <p className="text-sm text-muted-foreground">Allow customers to choose sizes and add-ons</p>
            </div>
            <Switch
              id="enable-options"
              checked={hasOptions}
              onCheckedChange={handleToggleOptions}
              disabled={updateDish.isPending}
            />
          </div>

          {hasOptions && !isLoading && (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Size/Type Options</Label>
                  <Button 
                    onClick={handleAddOption} 
                    size="sm" 
                    variant="outline"
                    disabled={createOption.isPending}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Option
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">Different sizes or variants (e.g., Small, Medium, Large)</p>
                
                {options.length > 0 ? (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleOptionDragEnd}>
                    <SortableContext items={options.map(o => o.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-2">
                        {options.map((option) => (
                          <SortableItem
                            key={option.id}
                            id={option.id}
                            name={option.name}
                            price={option.price}
                            onUpdate={handleUpdateOption}
                            onDelete={handleDeleteOption}
                            isPending={pendingUpdates.has(option.id)}
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
                  <Button 
                    onClick={handleAddModifier} 
                    size="sm" 
                    variant="outline"
                    disabled={createModifier.isPending}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Modifier
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">Optional extras (e.g., Cheese, Egg, Avocado)</p>
                
                {modifiers.length > 0 ? (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleModifierDragEnd}>
                    <SortableContext items={modifiers.map(m => m.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-2">
                        {modifiers.map((modifier) => (
                          <SortableItem
                            key={modifier.id}
                            id={modifier.id}
                            name={modifier.name}
                            price={modifier.price}
                            onUpdate={handleUpdateModifier}
                            onDelete={handleDeleteModifier}
                            isPending={pendingUpdates.has(modifier.id)}
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