import DishCard, { Dish } from "./DishCard";

interface MenuGridProps {
  dishes: Dish[];
}

const MenuGrid = ({ dishes }: MenuGridProps) => {
  return (
    <div className="px-6 py-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {dishes.map((dish) => (
          <DishCard key={dish.id} dish={dish} />
        ))}
      </div>
    </div>
  );
};

export default MenuGrid;
