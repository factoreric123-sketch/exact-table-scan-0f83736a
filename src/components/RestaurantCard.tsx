import { useNavigate } from "react-router-dom";
import { Restaurant, useDeleteRestaurant } from "@/hooks/useRestaurants";
import { Button } from "@/components/ui/button";
import { Edit, ExternalLink, Trash2 } from "lucide-react";
import restaurantHeroPlaceholder from "@/assets/restaurant-hero.jpg";
import { memo, useCallback } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface RestaurantCardProps {
  restaurant: Restaurant;
}

export const RestaurantCard = memo(({ restaurant }: RestaurantCardProps) => {
  const navigate = useNavigate();
  const deleteRestaurant = useDeleteRestaurant();

  const handleEdit = useCallback(() => {
    navigate(`/editor/${restaurant.id}`);
  }, [navigate, restaurant.id]);

  const handleOpen = useCallback(() => {
    window.open(`/${restaurant.slug}`, "_blank");
  }, [restaurant.slug]);

  const handleDelete = useCallback(() => {
    deleteRestaurant.mutate(restaurant.id);
  }, [deleteRestaurant, restaurant.id]);

  return (
    <div className="border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video bg-muted overflow-hidden">
        <img
          src={restaurant.hero_image_url || restaurantHeroPlaceholder}
          alt={restaurant.name}
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg mb-1">{restaurant.name}</h3>
        <p className="text-sm text-muted-foreground mb-4">{restaurant.tagline || "No tagline"}</p>
        
        <div className="flex items-center gap-2 mb-4">
          <span className={`text-xs px-2 py-1 rounded-full ${
            restaurant.published 
              ? "bg-green-500/10 text-green-500" 
              : "bg-yellow-500/10 text-yellow-500"
          }`}>
            {restaurant.published ? "Published" : "Draft"}
          </span>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleEdit}
            className="flex-1"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            onClick={handleOpen}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="icon"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Restaurant?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete "{restaurant.name}" and all its menu data. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
});

RestaurantCard.displayName = 'RestaurantCard';
