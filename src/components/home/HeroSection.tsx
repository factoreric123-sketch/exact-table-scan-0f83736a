import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Store, Users, Sparkles, Zap, Smartphone, QrCode } from "lucide-react";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[90vh] flex items-center py-12 lg:py-24 overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-accent/10 via-transparent to-primary/5 animate-gradient-shift" />
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
      </div>

      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Restaurant Owners */}
          <div className="text-center lg:text-left animate-fade-in-up space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20">
              <Store className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-accent">For Restaurant Owners</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
              Transform Your Menu Into a{" "}
              <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                Digital Masterpiece
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0">
              Create stunning digital menus in minutes. 10+ premium themes, instant updates, QR codes, and zero code required.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
              <Button
                onClick={() => navigate("/auth?signup=true")}
                size="lg"
                className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-lg h-14 px-8 shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Start Free Trial
              </Button>
              <Button
                onClick={() => navigate("/demo")}
                variant="outline"
                size="lg"
                className="text-lg h-14 px-8 hover:scale-105 transition-transform"
              >
                View Demo Menu
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-6 justify-center lg:justify-start pt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-accent" />
                <span>Setup in 5 minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-accent">✓</span>
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-accent">✓</span>
                <span>Free forever for 1 restaurant</span>
              </div>
            </div>
          </div>

          {/* Right: Customers */}
          <div className="text-center lg:text-left animate-fade-in-up animation-delay-200 space-y-6 lg:border-l lg:border-border/50 lg:pl-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">For Customers</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
              Scan, Browse, Order{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Effortlessly
              </span>
            </h2>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto lg:mx-0">
              Experience restaurant menus the modern way. Fast loading, beautiful design, and instant access with a simple QR code scan.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-4 max-w-md mx-auto lg:mx-0">
              <div className="flex flex-col items-center lg:items-start gap-2 p-4 rounded-lg bg-card/50 border border-border/50">
                <Smartphone className="w-8 h-8 text-accent" />
                <div className="text-left">
                  <div className="text-2xl font-bold">{'<100ms'}</div>
                  <div className="text-sm text-muted-foreground">Load Time</div>
                </div>
              </div>
              <div className="flex flex-col items-center lg:items-start gap-2 p-4 rounded-lg bg-card/50 border border-border/50">
                <QrCode className="w-8 h-8 text-accent" />
                <div className="text-left">
                  <div className="text-2xl font-bold">1 Scan</div>
                  <div className="text-sm text-muted-foreground">Instant Access</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
