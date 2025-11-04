import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, ExternalLink } from "lucide-react";

const DemoPreviewSection = () => {
  const navigate = useNavigate();

  return (
    <section id="demo" className="py-24 lg:py-32 bg-muted/30">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 animate-fade-in-up">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            See It in{" "}
            <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
              Action
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Experience a live demo of a restaurant menu built with TAPTAB. Try the interactive features and see why restaurants love us.
          </p>
        </div>

        {/* Demo Preview Card */}
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden border-2 border-border bg-card shadow-2xl group hover:border-accent/50 transition-all duration-300 animate-fade-in-up animation-delay-200">
            {/* Mockup Content */}
            <div className="aspect-[16/10] bg-gradient-to-br from-accent/5 via-background to-primary/5 flex items-center justify-center p-8">
              <div className="text-center space-y-6">
                <div className="w-20 h-20 mx-auto rounded-full bg-accent/10 flex items-center justify-center">
                  <ExternalLink className="w-10 h-10 text-accent" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Interactive Demo Menu</h3>
                  <p className="text-muted-foreground">
                    Browse a fully functional restaurant menu with real dishes, categories, and themes
                  </p>
                </div>
                <Button
                  onClick={() => navigate("/demo")}
                  size="lg"
                  className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold group-hover:scale-105 transition-transform"
                >
                  Try Interactive Demo
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-4 right-4 w-24 h-24 bg-accent/10 rounded-full blur-3xl" />
            <div className="absolute bottom-4 left-4 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
          </div>

          {/* Features List */}
          <div className="grid sm:grid-cols-3 gap-4 mt-8">
            {["Real-time Preview", "Mobile Responsive", "Theme Switching"].map((feature, index) => (
              <div
                key={index}
                className="text-center p-4 rounded-lg bg-card/50 border border-border/50 animate-fade-in-up"
                style={{ animationDelay: `${(index + 3) * 100}ms` }}
              >
                <div className="text-accent font-semibold">{feature}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default DemoPreviewSection;
