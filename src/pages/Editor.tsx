import { useParams } from "react-router-dom";
import { useRestaurantById } from "@/hooks/useRestaurants";

const Editor = () => {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const { data: restaurant, isLoading } = useRestaurantById(restaurantId || "");

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Restaurant not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border p-4">
        <h1 className="text-2xl font-bold">Editing: {restaurant.name}</h1>
        <p className="text-sm text-muted-foreground">Visual editor coming soon...</p>
      </header>
    </div>
  );
};

export default Editor;
