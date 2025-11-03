import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { logger } from "@/lib/logger";

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
        logger.error('Error fetching subscription:', error);
        return null;
      }

      // Handle empty array or null - return default free tier
      if (!data || data.length === 0) {
        return {
          has_premium: false,
          status: 'active',
          plan_type: 'free',
          current_period_end: null,
          cancel_at_period_end: false,
        } as SubscriptionStatus;
      }

      return data[0] as SubscriptionStatus;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes - subscription doesn't change often
    gcTime: 1000 * 60 * 30, // 30 minutes cache
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
