import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

interface PricingCardProps {
  title: string;
  price: string;
  description: string;
  features: string[];
  limitations?: string[];
  ctaText: string;
  ctaLink: string;
  popular?: boolean;
}

const PricingCard = ({ title, price, description, features, limitations, ctaText, ctaLink, popular }: PricingCardProps) => {
  return (
    <Card className={`relative ${popular ? "border-accent shadow-lg scale-105" : ""}`}>
      {popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground px-4 py-1 rounded-full text-sm font-medium">
          Most Popular
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-2xl">{title}</CardTitle>
        <p className="text-md text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-4xl font-bold">
          {price}
          {price !== "Custom" && <span className="text-lg font-normal text-muted-foreground">/month</span>}
        </div>
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-muted-foreground">•</span>
              <span className="text-sm">{feature}</span>
            </li>
          ))}
          {limitations?.map((limitation, index) => (
            <li key={`limit-${index}`} className="flex items-start gap-2">
              <span className="text-muted-foreground">•</span>
              <span className="text-sm">{limitation}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full" variant={popular ? "default" : "default"}>
          <Link to={ctaLink}>{ctaText}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PricingCard;
