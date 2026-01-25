import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Zap } from "lucide-react";
import demoMenuScreenshot from "@/assets/demo-menu-screenshot.png";

const DemoPreviewSection = () => {
  const navigate = useNavigate();

  return (
    <section id="demo" className="py-24 lg:py-32 bg-muted/30">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in-up">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Photos + Details = Happy Customers
          </h2>
          <p className="text-xl text-muted-foreground">
            Make sure your customers know what they're ordering. No more guessing games.
          </p>
        </div>

        {/* Demo Phone Mockup */}
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            
            {/* Phone Mockup */}
            <div className="relative flex-shrink-0 animate-fade-in-up animation-delay-200">
              {/* Floating badge */}
              <div className="absolute -top-3 -right-3 z-20 bg-card border border-border rounded-xl p-2.5 shadow-lg">
                <Zap className="w-5 h-5 text-orange-500" />
              </div>
              
              {/* Phone Frame */}
              <div className="relative w-[280px] sm:w-[320px] rounded-[2.5rem] bg-foreground p-3 shadow-2xl">
                {/* Screen with actual screenshot */}
                <div className="rounded-[2rem] overflow-hidden">
                  <img 
                    src={demoMenuScreenshot} 
                    alt="MenuTap demo showing restaurant menu with dishes, photos, allergens and pricing"
                    className="w-full h-auto"
                  />
                </div>
              </div>
              
              {/* Glow effect behind phone */}
              <div className="absolute inset-0 -z-10 blur-3xl opacity-20 bg-foreground rounded-full scale-75" />
            </div>

            {/* Text Content */}
            <div className="flex-1 text-center lg:text-left space-y-8">
              <div className="space-y-4">
                <h3 className="text-3xl sm:text-4xl font-bold">
                  See it in action
                </h3>
                <p className="text-lg text-muted-foreground max-w-md mx-auto lg:mx-0">
                  Browse our interactive demo featuring real dishes, photos, dietary filters, and the premium design your guests will love.
                </p>
              </div>

              {/* Feature list */}
              <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                {["Photos", "Allergens", "Dietary filters", "Live updates"].map((feature) => (
                  <span
                    key={feature}
                    className="px-4 py-2 bg-card border border-border rounded-full text-sm font-medium"
                  >
                    {feature}
                  </span>
                ))}
              </div>

              {/* CTA */}
              <Button
                onClick={() => navigate("/demo")}
                size="lg"
                className="bg-foreground hover:bg-foreground/90 text-background font-semibold text-lg h-14 px-8 group/btn"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                View live demo
                <ArrowRight className="w-5 h-5 ml-2 group-hover/btn:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>

          {/* Feature highlights */}
          <div className="grid sm:grid-cols-4 gap-4 mt-20">
            {[
              { title: "7 Allergen Filters", desc: "Gluten, dairy, nuts & more" },
              { title: "Dietary Options", desc: "Vegan, vegetarian, spicy" },
              { title: "Dish Badges", desc: "New, popular, chef's pick" },
              { title: "Live Preview", desc: "See changes instantly" },
            ].map((feature, index) => (
              <div
                key={index}
                className="text-center p-5 rounded-xl bg-card border border-border animate-fade-in-up"
                style={{ animationDelay: `${(index + 3) * 100}ms` }}
              >
                <div className="font-semibold mb-1 text-foreground">{feature.title}</div>
                <div className="text-sm text-muted-foreground">{feature.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default DemoPreviewSection;
