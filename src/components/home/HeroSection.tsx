import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Check } from "lucide-react";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[85vh] flex items-center py-20 lg:py-32 overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-muted/20 to-background" />

      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Main value proposition */}
          <div className="text-center lg:text-left animate-fade-in-up space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-foreground text-background text-sm font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-background opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-background"></span>
              </span>
              500+ restaurants already made the switch
            </div>

            {/* Main headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight">
              It's 2026.{" "}
              <span className="block mt-2">Your menu shouldn't</span>
              <span className="inline-block bg-foreground text-background px-3 py-1 mt-2">
                be a PDF.
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Create beautiful, fast-loading digital menus in minutes. No coding, no headaches, no credit card required.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
              <Button
                onClick={() => navigate("/auth?signup=true")}
                size="lg"
                className="bg-foreground hover:bg-foreground/90 text-background font-semibold text-lg h-14 px-8 group"
              >
                Start for free
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                onClick={() => navigate("/demo")}
                variant="outline"
                size="lg"
                className="text-lg h-14 px-8"
              >
                View demo
              </Button>
            </div>

            {/* Trust signals */}
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3 justify-center lg:justify-start pt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>Setup in 5 minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>Free forever</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>No credit card</span>
              </div>
            </div>
          </div>

          {/* Right: Product preview */}
          <div className="relative animate-fade-in-up animation-delay-200">
            {/* Main device mockup */}
            <div className="relative mx-auto max-w-sm lg:max-w-md">
              {/* Phone frame */}
              <div className="relative bg-foreground rounded-[2.5rem] p-3 shadow-2xl">
                <div className="bg-background rounded-[2rem] overflow-hidden border-4 border-foreground/5">
                  {/* Menu preview */}
                  <div className="aspect-[9/19] bg-gradient-to-b from-card to-background p-6 space-y-4">
                    <div className="flex items-center justify-between pb-4 border-b border-border">
                      <div className="space-y-1">
                        <div className="h-6 w-32 bg-foreground/80 rounded" />
                        <div className="h-3 w-24 bg-foreground/20 rounded" />
                      </div>
                      <div className="h-8 w-8 bg-foreground/10 rounded-full" />
                    </div>
                    
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-3 p-3 bg-card rounded-lg border border-border">
                          <div className="h-16 w-16 bg-muted rounded-md flex-shrink-0" />
                          <div className="flex-1 space-y-2">
                            <div className="h-3 w-full bg-foreground/60 rounded" />
                            <div className="h-2 w-3/4 bg-foreground/20 rounded" />
                            <div className="h-3 w-16 bg-foreground/40 rounded" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 bg-card border border-border rounded-lg p-3 shadow-lg animate-bounce">
                <div className="text-2xl font-bold">⚡</div>
              </div>
              <div className="absolute -bottom-4 -left-4 bg-card border border-border rounded-lg px-4 py-2 shadow-lg">
                <div className="text-xs font-semibold">{'<100ms'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
