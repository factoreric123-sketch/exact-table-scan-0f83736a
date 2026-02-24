import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";

const CTASection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24 lg:py-32">
      <div className="container max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-foreground text-background p-12 lg:p-16 overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-background rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-background rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 text-center space-y-8">
            {/* Main headline */}
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
              The easiest menu your guests will ever use.
            </h2>

            {/* Description */}
            <p className="text-xl text-background/80 max-w-2xl mx-auto">
              Menus that remove confusion. Create your digital menu in minutes.
            </p>

            {/* CTA */}
            <div className="flex justify-center pt-4">
              <Button
                onClick={() => navigate("/pricing")}
                size="lg"
                className="bg-background hover:bg-background/90 text-foreground font-semibold text-lg h-14 px-8 group"
              >
                Get started free
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

            {/* Feature checklist */}
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 pt-6 text-sm text-background/80">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>Setup in 5 minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>No technical skills needed</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>No credit card needed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
