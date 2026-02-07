import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[85vh] flex items-center py-20 lg:py-32 overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-muted/20 to-background" />

      <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center animate-fade-in-up space-y-8">
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
          <p className="text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Create beautiful, fast-loading digital menus in minutes. No coding, no headaches, no credit card required.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
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

        </div>
      </div>
    </section>
  );
};

export default HeroSection;
