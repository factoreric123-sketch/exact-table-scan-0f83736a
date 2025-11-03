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
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: restaurants, isLoading } = useRestaurants();
  const { hasPremium, subscription, refetch } = useSubscription();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

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

  // Safety timeout to avoid infinite loading when backend is unreachable
  useEffect(() => {
    if (!isLoading) {
      setTimedOut(false);
      return;
    }
    const timer = setTimeout(() => setTimedOut(true), 8000);
    return () => clearTimeout(timer);
  }, [isLoading]);

  if (isLoading && !timedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading your restaurants...</p>
        </div>
      </div>
    );
  }

  if (isLoading && timedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 max-w-md text-center p-4">
          <p className="text-lg font-medium text-foreground">Connection timeout</p>
          <p className="text-sm text-muted-foreground">
            Our backend is taking too long to respond. Please try again.
          </p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  if (!restaurants && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 max-w-md text-center p-4">
          <p className="text-lg font-medium text-foreground">Unable to load restaurants</p>
          <p className="text-sm text-muted-foreground">
            We're experiencing connection issues. Please try again in a moment.
          </p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">My Restaurants</h1>
            <div className="flex items-center gap-2 mt-1">
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
            </div>
          </div>
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

      <PaywallModal
        open={showPaywall}
        onOpenChange={setShowPaywall}
        feature="Premium Features"
      />
    </div>
  );
};

export default Dashboard;
