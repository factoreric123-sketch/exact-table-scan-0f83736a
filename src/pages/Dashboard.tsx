import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRestaurants } from "@/hooks/useRestaurants";
import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Plus, LogOut, Crown } from "lucide-react";
import { CreateRestaurantModal } from "@/components/CreateRestaurantModal";
import { RestaurantCard } from "@/components/RestaurantCard";
import { PremiumBadge } from "@/components/PremiumBadge";
import { PaywallModal } from "@/components/PaywallModal";
import { toast } from "@/hooks/use-toast";

const Dashboard = () => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: allRestaurants = [], isLoading } = useRestaurants();
  
  // Defensive filter: only show restaurants owned by current user
  const restaurants = allRestaurants.filter(r => r.owner_id === user?.id);
  const { hasPremium, subscription, refetch, isLoading: subscriptionLoading } = useSubscription();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  // Handle successful payment redirect
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');

    if (success) {
      toast({
        title: "Welcome to Premium! 🎉",
        description: "Your subscription is now active. Enjoy all premium features!",
      });
      // Remove query params
      setSearchParams({});
      // Refetch subscription status
      refetch();
    } else if (canceled) {
      toast({
        title: "Checkout Canceled",
        description: "You can upgrade to premium anytime from your dashboard.",
      });
      setSearchParams({});
    }
  }, [searchParams, setSearchParams, refetch]);

  return (
    <div className="min-h-screen bg-background" style={{ minHeight: '100vh' }}>
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">My Restaurants</h1>
            <div className="flex items-center gap-2 mt-1">
              {subscriptionLoading ? (
                <div className="h-5 w-20 bg-muted animate-pulse rounded" />
              ) : (
                <>
                  <PremiumBadge isPremium={hasPremium} />
                  {!hasPremium && (
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-primary"
                      onClick={() => setShowPaywall(true)}
                    >
                      Upgrade to Premium
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Create card skeleton */}
            <div className="border-2 border-dashed border-border rounded-lg p-8 min-h-[300px] animate-pulse">
              <div className="h-16 w-16 rounded-full bg-muted mx-auto mb-4" />
              <div className="h-4 w-32 bg-muted rounded mx-auto mb-2" />
              <div className="h-3 w-48 bg-muted rounded mx-auto" />
            </div>
            {/* Restaurant card skeletons */}
            {[1, 2].map((i) => (
              <div key={i} className="border border-border rounded-lg overflow-hidden">
                <div className="aspect-video bg-muted animate-pulse" />
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-muted rounded animate-pulse" />
                  <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
                  <div className="h-8 bg-muted rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : (
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
            {restaurants.map((restaurant) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        )}

        {!isLoading && restaurants.length === 0 && (
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

      <PaywallModal
        open={showPaywall}
        onOpenChange={setShowPaywall}
        feature="Premium Features"
      />
    </div>
  );
};

export default Dashboard;
