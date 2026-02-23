import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

interface PricingCardProps {
  title: string;
  price: string;
  description: string;
  features: string[];
  ctaText: string;
  ctaLink: string;
  popular?: boolean;
}

const PricingCard = ({ title, price, description, features, ctaText, ctaLink, popular }: PricingCardProps) => {
  return (
    <Card className={`relative bg-foreground text-background ${popular ? "border-foreground/30 shadow-lg scale-105" : "border-foreground/20"}`}>
      {popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-background text-foreground px-4 py-1 rounded-full text-sm font-medium border border-foreground/20">
          Most Popular
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-2xl text-background">{title}</CardTitle>
        <p className="text-md text-background/70">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-4xl font-bold text-background">
          {price}
          {price !== "Custom" && <span className="text-lg font-normal text-background/70">/month</span>}
        </div>
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-background/50">•</span>
              <span className="text-sm text-background">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full bg-background text-foreground hover:bg-background/90">
          <Link to={ctaLink}>{ctaText}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PricingCard;
