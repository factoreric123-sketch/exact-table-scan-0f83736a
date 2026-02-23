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

          {/* Trust signals */}
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-muted-foreground pt-2">
            {["Setup in 5 minutes", "No technical skills needed", "No credit card needed"].map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                {item}
              </span>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;
