import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Crown, CreditCard, Loader2, Mail, Calendar, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";

interface AccountSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AccountSettingsDialog = ({ open, onOpenChange }: AccountSettingsDialogProps) => {
  const { user } = useAuth();
  const { subscription, hasPremium, isLoading: subLoading, refetch } = useSubscription();
  const [portalLoading, setPortalLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);

  const handleSyncSubscription = async () => {
    setSyncLoading(true);
    try {
      const { error } = await supabase.functions.invoke('fix-subscription');
      if (error) throw error;
      await refetch();
      toast({ title: "Subscription synced", description: "Your subscription status has been updated." });
    } catch (error) {
      logger.error('Sync error:', error);
      toast({ title: "Sync failed", description: "Could not sync subscription. Please try again.", variant: "destructive" });
    } finally {
      setSyncLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-billing-portal');

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      logger.error('Error opening billing portal:', error);
      toast({
        title: "Error",
        description: "Failed to open billing portal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPortalLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Account Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Account Info */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Account</h3>
            <div className="flex items-center gap-3 rounded-lg border border-border p-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{user?.email}</span>
            </div>
          </div>

          <Separator />

          {/* Subscription Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Subscription</h3>

            {subLoading ? (
              <div className="space-y-2">
                <div className="h-10 bg-muted animate-pulse rounded-lg" />
                <div className="h-10 bg-muted animate-pulse rounded-lg" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="flex items-center gap-2">
                    <Crown className={`h-4 w-4 ${hasPremium ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="text-sm font-medium">
                      {hasPremium ? "Premium Plan" : "Free Plan"}
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    subscription?.status === "active" || subscription?.status === "trialing"
                      ? "bg-green-500/10 text-green-500"
                      : subscription?.status === "past_due"
                      ? "bg-yellow-500/10 text-yellow-500"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {subscription?.status === "trialing" ? "Trial" : subscription?.status ?? "active"}
                  </span>
                </div>

                {hasPremium && subscription?.current_period_end && (
                  <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div className="text-sm">
                      <span className="text-muted-foreground">
                        {subscription.cancel_at_period_end ? "Expires on" : "Renews on"}:
                      </span>{" "}
                      <span className="font-medium">{formatDate(subscription.current_period_end)}</span>
                    </div>
                  </div>
                )}

                {subscription?.cancel_at_period_end && (
                  <p className="text-xs text-yellow-500">
                    Your subscription will not renew. You'll lose premium features after the current period ends.
                  </p>
                )}

                {!hasPremium && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSyncSubscription}
                    disabled={syncLoading}
                    className="w-full text-xs text-muted-foreground"
                  >
                    {syncLoading ? (
                      <><Loader2 className="mr-1 h-3 w-3 animate-spin" />Syncing...</>
                    ) : (
                      <><RefreshCw className="mr-1 h-3 w-3" />Already paid? Sync subscription</>
                    )}
                  </Button>
                )}
              </>
            )}
          </div>

          <Separator />

          {/* Billing Actions */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Billing</h3>

            {hasPremium ? (
              <Button
                onClick={handleManageBilling}
                disabled={portalLoading}
                variant="outline"
                className="w-full"
              >
                {portalLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Opening...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Manage Billing & Subscription
                  </>
                )}
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                Upgrade to Premium to access billing management.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
