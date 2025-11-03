import { useState, memo, useCallback } from "react";
import DishCard, { Dish } from "./DishCard";
import { DishDetailDialog, DishDetail } from "./DishDetailDialog";

interface MenuGridProps {
  dishes: Dish[];
  sectionTitle: string;
}

const MenuGrid = memo(({ dishes, sectionTitle }: MenuGridProps) => {
  const [selectedDish, setSelectedDish] = useState<DishDetail | null>(null);

  // Memoize callback to prevent re-renders
  const handleDishClick = useCallback((dish: Dish) => {
    setSelectedDish({
      id: dish.id,
      name: dish.name,
      description: dish.description,
      price: dish.price,
      image: dish.image,
      allergens: dish.allergens,
      calories: dish.calories,
      isVegetarian: dish.isVegetarian,
      isVegan: dish.isVegan,
      isSpicy: dish.isSpicy,
    });
  }, []);

  if (dishes.length === 0) {
    return (
      <div className="px-6 py-12 text-center">
        <p className="text-muted-foreground">No dishes available in this category.</p>
      </div>
    );
  }

  return (
    <>
      <div className="px-6 py-8">
        <h2 className="text-3xl font-bold text-foreground mb-6">{sectionTitle}</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {dishes.map((dish) => (
            <DishCard key={dish.id} dish={dish} onClick={() => handleDishClick(dish)} />
          ))}
        </div>
      </div>

      <DishDetailDialog
        dish={selectedDish}
        open={!!selectedDish}
        onOpenChange={(open) => !open && setSelectedDish(null)}
      />
    </>
  );
});

MenuGrid.displayName = 'MenuGrid';

export default MenuGrid;
