import { useNavigate } from "react-router-dom";
import { Restaurant } from "@/hooks/useRestaurants";
import { Button } from "@/components/ui/button";
import { Edit, ExternalLink } from "lucide-react";
import restaurantHeroPlaceholder from "@/assets/restaurant-hero.jpg";

interface RestaurantCardProps {
  restaurant: Restaurant;
}

export const RestaurantCard = ({ restaurant }: RestaurantCardProps) => {
  const navigate = useNavigate();

  return (
    <div className="border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video bg-muted overflow-hidden">
        <img
          src={restaurant.hero_image_url || restaurantHeroPlaceholder}
          alt={restaurant.name}
          className="w-full h-full object-cover"
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
            onClick={() => navigate(`/editor/${restaurant.id}`)}
            className="flex-1"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            onClick={() => window.open(`/${restaurant.slug}`, "_blank")}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
