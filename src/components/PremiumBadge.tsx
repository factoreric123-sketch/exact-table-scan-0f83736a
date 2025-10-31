import { Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PremiumBadgeProps {
  isPremium: boolean;
  className?: string;
}

export const PremiumBadge = ({ isPremium, className }: PremiumBadgeProps) => {
  if (isPremium) {
    return (
      <Badge variant="default" className={className}>
        <Crown className="mr-1 h-3 w-3" />
        Premium
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={className}>
      Free Plan
    </Badge>
  );
};
