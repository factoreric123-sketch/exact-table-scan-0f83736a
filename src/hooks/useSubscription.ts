import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface SubscriptionStatus {
  has_premium: boolean;
  status: string;
  plan_type: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

export const useSubscription = () => {
  const { user } = useAuth();

  const { data: subscription, isLoading, refetch } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .rpc('get_subscription_status');

      if (error) {
        console.error('Error fetching subscription:', error);
        return null;
      }

      return data?.[0] as SubscriptionStatus | null;
    },
    enabled: !!user,
  });

  const hasPremium = subscription?.has_premium ?? false;
  const isFreeTier = !hasPremium;

  return {
    subscription,
    isLoading,
    hasPremium,
    isFreeTier,
    refetch,
  };
};
