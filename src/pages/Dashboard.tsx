import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRestaurants } from "@/hooks/useRestaurants";
import { Button } from "@/components/ui/button";
import { Plus, LogOut } from "lucide-react";
import { CreateRestaurantModal } from "@/components/CreateRestaurantModal";
import { RestaurantCard } from "@/components/RestaurantCard";

const Dashboard = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { data: restaurants, isLoading } = useRestaurants();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">My Restaurants</h1>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Create New Restaurant Card */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center gap-4 hover:border-primary transition-colors min-h-[300px]"
          >
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Plus className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-lg mb-1">Create New Restaurant</h3>
              <p className="text-sm text-muted-foreground">
                Start building your digital menu
              </p>
            </div>
          </button>

          {/* Restaurant Cards */}
          {restaurants?.map((restaurant) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>

        {restaurants?.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              You haven't created any restaurants yet. Click the card above to get started!
            </p>
          </div>
        )}
      </main>

      <CreateRestaurantModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
      />
    </div>
  );
};

export default Dashboard;
