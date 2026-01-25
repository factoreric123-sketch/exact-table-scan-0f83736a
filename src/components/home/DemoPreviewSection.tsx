import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Eye } from "lucide-react";

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

        {/* Demo Card */}
        <div className="max-w-5xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden border border-border bg-card shadow-2xl group animate-fade-in-up animation-delay-200">
            {/* Content */}
            <div className="aspect-[16/9] bg-gradient-to-br from-muted/30 to-background flex items-center justify-center p-12">
              <div className="text-center space-y-8 max-w-xl">
                {/* Icon */}
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-foreground text-background group-hover:scale-110 transition-transform">
                  <Eye className="w-10 h-10" />
                </div>

                {/* Text */}
                <div className="space-y-4">
                  <h3 className="text-3xl font-bold">4 Charles Prime Steakhouse</h3>
                  <p className="text-lg text-muted-foreground">
                    Browse our interactive demo featuring real dishes, dietary filters, and premium design
                  </p>
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

            {/* Floating elements for visual interest */}
            <div className="absolute top-8 right-8 w-32 h-32 bg-foreground/5 rounded-full blur-3xl" />
            <div className="absolute bottom-8 left-8 w-40 h-40 bg-foreground/5 rounded-full blur-3xl" />
          </div>

          {/* Feature highlights */}
          <div className="grid sm:grid-cols-3 gap-6 mt-12">
            {[
              { title: "Allergen Filtering", desc: "Smart dietary options" },
              { title: "Mobile Perfect", desc: "Instant loading" },
              { title: "Real-time Updates", desc: "Change anything, anytime" },
            ].map((feature, index) => (
              <div
                key={index}
                className="text-center p-6 rounded-xl bg-card border border-border animate-fade-in-up"
                style={{ animationDelay: `${(index + 3) * 100}ms` }}
              >
                <div className="font-semibold mb-1 text-black">{feature.title}</div>
                <div className="text-sm text-black">{feature.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default DemoPreviewSection;
