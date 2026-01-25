import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Zap } from "lucide-react";

const DemoPreviewSection = () => {
  const navigate = useNavigate();

  // Mock dish data for the preview
  const mockDishes = [
    { name: "Grilled Salmon", desc: "Fresh Atlantic salmon with lemon butter", price: "$28" },
    { name: "Ribeye Steak", desc: "12oz prime cut, herb-crusted", price: "$42" },
    { name: "Truffle Pasta", desc: "Handmade pasta with black truffle", price: "$24" },
  ];

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
                {/* Screen */}
                <div className="rounded-[2rem] overflow-hidden bg-gradient-to-b from-stone-200 to-stone-300">
                  {/* Status bar area */}
                  <div className="h-6 bg-stone-200/80" />
                  
                  {/* Menu Content */}
                  <div className="px-4 pb-6 pt-2 space-y-3">
                    {/* Category Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-6 w-28 bg-stone-400/60 rounded" />
                      <div className="h-4 w-4 rounded-full bg-stone-300/80" />
                    </div>
                    
                    {/* Divider */}
                    <div className="h-px bg-stone-400/30 -mx-4" />
                    
                    {/* Dish Cards */}
                    {mockDishes.map((dish, index) => (
                      <div
                        key={index}
                        className="flex gap-3 p-3 bg-stone-300/50 rounded-xl border border-stone-400/20"
                      >
                        {/* Image placeholder */}
                        <div className="w-16 h-16 rounded-lg bg-stone-500/40 flex-shrink-0" />
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="h-4 w-3/4 bg-stone-400/60 rounded" />
                          <div className="h-3 w-full bg-stone-400/40 rounded" />
                          <div className="h-3 w-16 bg-stone-400/50 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
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
                {["Photos", "Allergens", "Dietary filters", "20+ Themes", "QR Codes", "Drag & Drop", "Size Options", "Add-ons", "Badges", "Customization", "Desktop · Tablet · Mobile"].map((feature) => (
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

        </div>
      </div>
    </section>
  );
};

export default DemoPreviewSection;
