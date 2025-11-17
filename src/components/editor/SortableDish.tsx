import { useState, useEffect, useRef, useCallback } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { useDebounce } from "use-debounce";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, Image as ImageIcon, ChevronDown, Flame, Sparkles, Star, TrendingUp, ChefHat, Wheat, Milk, Egg, Fish, Shell, Nut, Sprout, Beef, Bird, Leaf, Salad, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { InlineEdit } from "./InlineEdit";
import { useUpdateDish, useDeleteDish, type Dish } from "@/hooks/useDishes";
import { ImageCropModal } from "@/components/ImageCropModal";
import { useImageUpload } from "@/hooks/useImageUpload";
import { ALLERGEN_OPTIONS } from "@/components/AllergenFilter";
import { DishOptionsEditor } from "./DishOptionsEditor";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface SortableDishProps {
  dish: Dish;
  subcategoryId: string;
}

export const SortableDish = ({ dish, subcategoryId }: SortableDishProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: dish.id,
  });
  const updateDish = useUpdateDish();
  const deleteDish = useDeleteDish();
  const uploadImage = useImageUpload();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showOptionsEditor, setShowOptionsEditor] = useState(false);
  const [localCalories, setLocalCalories] = useState(dish.calories?.toString() || "");
  const [debouncedCalories] = useDebounce(localCalories, 200); // Reduced from 500ms to 200ms for instant feel
  
  // Optimistic local state for instant feedback
  const [localAllergens, setLocalAllergens] = useState<string[]>(dish.allergens || []);
  const [localVegetarian, setLocalVegetarian] = useState(dish.is_vegetarian);
  const [localVegan, setLocalVegan] = useState(dish.is_vegan);
  const [localSpicy, setLocalSpicy] = useState(dish.is_spicy);
  const [localNew, setLocalNew] = useState(dish.is_new);
  const [localSpecial, setLocalSpecial] = useState(dish.is_special);
  const [localPopular, setLocalPopular] = useState(dish.is_popular);
  const [localChefRec, setLocalChefRec] = useState(dish.is_chef_recommendation);

  // Sync local state when dish prop changes
  useEffect(() => {
    setLocalAllergens(dish.allergens || []);
    setLocalVegetarian(dish.is_vegetarian);
    setLocalVegan(dish.is_vegan);
    setLocalSpicy(dish.is_spicy);
    setLocalNew(dish.is_new);
    setLocalSpecial(dish.is_special);
    setLocalPopular(dish.is_popular);
    setLocalChefRec(dish.is_chef_recommendation);
  }, [dish]);

  // Update database only when debounced value changes
  useEffect(() => {
    const caloriesNum = debouncedCalories ? parseInt(debouncedCalories) : null;
    if (caloriesNum !== dish.calories) {
      handleUpdate("calories", caloriesNum);
    }
  }, [debouncedCalories]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? transition : "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    opacity: isDragging ? 0.3 : 1,
  };

  // Batched update mechanism to prevent lag
  const pendingUpdates = useRef<Partial<Dish>>({});
  const updateTimer = useRef<any>(null);

  const scheduleUpdate = useCallback((updates: Partial<Dish>) => {
    pendingUpdates.current = { ...pendingUpdates.current, ...updates };
    
    if (updateTimer.current) {
      clearTimeout(updateTimer.current);
    }
    
    updateTimer.current = setTimeout(() => {
      const toUpdate = pendingUpdates.current;
      pendingUpdates.current = {};
      updateTimer.current = null;
      
      updateDish.mutate({
        id: dish.id,
        updates: toUpdate,
      });
    }, 50); // Reduced from 150ms to 50ms for 3x faster response
  }, [dish.id, updateDish]);

  const handleUpdate = (field: keyof Dish, value: string | boolean | string[] | number | null) => {
    scheduleUpdate({ [field]: value });
  };

  const handleAllergenToggle = (allergen: string) => {
    const updated = localAllergens.includes(allergen)
      ? localAllergens.filter((a) => a !== allergen)
      : [...localAllergens, allergen];
    setLocalAllergens(updated);
    scheduleUpdate({ allergens: updated });
  };

  const handleToggle = (field: keyof Dish, currentValue: boolean, setter: (v: boolean) => void) => {
    setter(!currentValue);
    scheduleUpdate({ [field]: !currentValue });
  };

  const handleDelete = () => {
    deleteDish.mutate({ id: dish.id, subcategoryId });
    setShowDeleteDialog(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setShowCropModal(true);
    }
  };

  const handleImageCrop = async (croppedFile: File) => {
    try {
      const imageUrl = await uploadImage.mutateAsync({
        file: croppedFile,
        bucket: "dish-images",
        path: `${dish.id}/${croppedFile.name}`,
      });
      
      updateDish.mutate({
        id: dish.id,
        updates: { image_url: imageUrl },
      });
      
      setShowCropModal(false);
      setSelectedImage(null);
      toast.success("Image updated");
    } catch (error) {
      toast.error("Failed to upload image");
    }
  };

  return (
    <>
      <div ref={setNodeRef} style={style} className="group relative">
      {/* Stacked badges */}
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 items-end">
        {localNew && (
          <Badge className="bg-ios-green text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            New
          </Badge>
        )}
        {localSpecial && (
          <Badge className="bg-ios-orange text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1">
            <Star className="h-3 w-3" />
            Special
          </Badge>
        )}
        {localPopular && (
          <Badge className="bg-ios-blue text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            Popular
          </Badge>
        )}
        {localChefRec && (
          <Badge className="bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1">
            <ChefHat className="h-3 w-3" />
            Chef's Pick
          </Badge>
        )}
      </div>
        
        <div className="absolute top-2 left-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            {...attributes}
            {...listeners}
            className="bg-background/90 backdrop-blur p-1.5 rounded-md cursor-grab active:cursor-grabbing hover:bg-background"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowDeleteDialog(true)}
            className="bg-background/90 backdrop-blur p-1.5 rounded-md hover:bg-destructive hover:text-destructive-foreground transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <div className="bg-dish-card rounded-2xl overflow-hidden aspect-square mb-2.5 relative shadow-md group/image">
          {dish.image_url ? (
            <img 
              src={dish.image_url} 
              alt={dish.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <ImageIcon className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          
          <label className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur opacity-0 group-hover/image:opacity-100 transition-opacity cursor-pointer">
            <div className="text-center">
              <ImageIcon className="h-8 w-8 mx-auto mb-2" />
              <span className="text-sm font-medium">Change Photo</span>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
          </label>
        </div>

        <div>
          <InlineEdit
            value={dish.name}
            onSave={(value) => handleUpdate("name", value)}
            className="text-base font-bold text-foreground mb-1 w-full"
          />
          <InlineEdit
            value={dish.description || ""}
            onSave={(value) => handleUpdate("description", value)}
            className="text-xs text-muted-foreground mb-1.5 w-full"
            multiline
          />
          <InlineEdit
            value={dish.price}
            onSave={(value) => handleUpdate("price", value)}
            className="text-sm font-semibold text-foreground w-full"
          />

          {/* Expandable dietary info */}
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded} className="mt-3">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between p-2 h-auto">
                <span className="text-xs font-medium">Dietary Info</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-3 p-2 bg-muted/30 rounded-lg">
              {/* Allergens */}
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Allergens</Label>
                <div className="flex flex-wrap gap-1.5">
                  {ALLERGEN_OPTIONS.map((option) => {
                    const Icon = option.Icon;
                    const isSelected = localAllergens.includes(option.value);
                    return (
                      <Badge
                        key={option.value}
                        variant={isSelected ? "default" : "outline"}
                        className="cursor-pointer text-xs flex items-center gap-1 active:scale-95"
                        onClick={() => handleAllergenToggle(option.value)}
                      >
                        <Icon className="h-3 w-3" />
                        {option.label}
                      </Badge>
                    );
                  })}
                </div>
              </div>

              {/* Calories */}
              <div className="flex items-center gap-2">
                <Label htmlFor={`calories-${dish.id}`} className="text-xs text-muted-foreground">
                  Calories
                </Label>
                <Input
                  id={`calories-${dish.id}`}
                  type="number"
                  value={localCalories}
                  onChange={(e) => setLocalCalories(e.target.value)}
                  className="h-8 text-xs w-24"
                  placeholder="0"
                />
              </div>

              {/* Dietary preferences */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`vegetarian-${dish.id}`} className="text-xs flex items-center gap-1.5">
                    <Salad className="h-3.5 w-3.5 text-ios-green" />
                    Vegetarian
                  </Label>
                  <Switch
                    id={`vegetarian-${dish.id}`}
                    checked={localVegetarian}
                    onCheckedChange={() => handleToggle("is_vegetarian", localVegetarian, setLocalVegetarian)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor={`vegan-${dish.id}`} className="text-xs flex items-center gap-1.5">
                    <Sprout className="h-3.5 w-3.5 text-ios-green" />
                    Vegan
                  </Label>
                  <Switch
                    id={`vegan-${dish.id}`}
                    checked={localVegan}
                    onCheckedChange={() => handleToggle("is_vegan", localVegan, setLocalVegan)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor={`spicy-${dish.id}`} className="text-xs flex items-center gap-1.5">
                    <Flame className="h-3.5 w-3.5 text-ios-red" />
                    Spicy
                  </Label>
                  <Switch
                    id={`spicy-${dish.id}`}
                    checked={localSpicy}
                    onCheckedChange={() => handleToggle("is_spicy", localSpicy, setLocalSpicy)}
                  />
                </div>
              </div>

              {/* Badge Section */}
              <div className="space-y-2 pt-2 border-t border-border">
                <Label className="text-xs text-muted-foreground">Badges & Labels</Label>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor={`new-${dish.id}`} className="text-xs flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-ios-green" />
                    New Addition
                  </Label>
                  <Switch
                    id={`new-${dish.id}`}
                    checked={localNew}
                    onCheckedChange={() => handleToggle("is_new", localNew, setLocalNew)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor={`special-${dish.id}`} className="text-xs flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 text-ios-orange" />
                    Special
                  </Label>
                  <Switch
                    id={`special-${dish.id}`}
                    checked={localSpecial}
                    onCheckedChange={() => handleToggle("is_special", localSpecial, setLocalSpecial)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor={`popular-${dish.id}`} className="text-xs flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-ios-blue" />
                    Popular
                  </Label>
                  <Switch
                    id={`popular-${dish.id}`}
                    checked={localPopular}
                    onCheckedChange={() => handleToggle("is_popular", localPopular, setLocalPopular)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor={`chef-${dish.id}`} className="text-xs flex items-center gap-1.5">
                    <ChefHat className="h-3.5 w-3.5 text-purple-500" />
                    Chef's Recommendation
                  </Label>
                  <Switch
                    id={`chef-${dish.id}`}
                    checked={localChefRec}
                    onCheckedChange={() => handleToggle("is_chef_recommendation", localChefRec, setLocalChefRec)}
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Pricing Options Button */}
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2"
            onClick={() => setShowOptionsEditor(true)}
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Pricing Options
            {dish.has_options && (
              <Badge variant="secondary" className="ml-2">
                Enabled
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {selectedImage && (
        <ImageCropModal
          open={showCropModal}
          onOpenChange={setShowCropModal}
          imageFile={selectedImage}
          onCropComplete={handleImageCrop}
        />
      )}

      <DishOptionsEditor
        dishId={dish.id}
        dishName={dish.name}
        hasOptions={dish.has_options}
        open={showOptionsEditor}
        onOpenChange={setShowOptionsEditor}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Dish</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{dish.name}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
