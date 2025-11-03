import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Crown, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface PaywallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature: string;
}

export const PaywallModal = ({ open, onOpenChange, feature }: PaywallModalProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to upgrade to premium",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          userId: user.id,
          email: user.email,
        },
      });

      if (error) throw error;

      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        title: "Error",
        description: "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const benefits = [
    "Generate and download your menu QR code",
    "Publish menus publicly and live",
    "Get shareable link",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Crown className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-2xl">
            Upgrade to Premium
          </DialogTitle>
          <DialogDescription className="text-center">
            Unlock <strong>{feature}</strong> and more with TapMenu Premium
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="text-center">
            <div className="text-4xl font-bold">$10</div>
            <div className="text-sm text-muted-foreground">per month • Cancel anytime</div>
            <div className="mt-2 inline-block rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
              14-day free trial
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-semibold">What you get:</div>
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Check className="h-3 w-3 text-primary" />
                </div>
                <span className="text-sm">{benefit}</span>
              </div>
            ))}
          </div>

          <Button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Crown className="mr-2 h-4 w-4" />
                Start 14-Day Free Trial
              </>
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Credit card required. Cancel anytime.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
