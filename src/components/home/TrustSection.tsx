import { Building2, Users, Utensils, Coffee } from "lucide-react";

const TrustSection = () => {
  return (
    <section className="py-16 lg:py-20 border-y border-border bg-muted/20">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Social proof header */}
        <div className="text-center mb-12">
          <p className="text-lg font-medium text-foreground">
            Customers know exactly what they're ordering.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Trusted by restaurants worldwide
          </p>
        </div>

        {/* Restaurant type logos */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center opacity-60">
          <div className="flex flex-col items-center gap-3 group cursor-default">
            <div className="p-4 rounded-full bg-card border border-border group-hover:border-foreground/20 transition-colors">
              <Utensils className="w-8 h-8" />
            </div>
            <span className="text-sm font-medium">Fine Dining</span>
          </div>
          
          <div className="flex flex-col items-center gap-3 group cursor-default">
            <div className="p-4 rounded-full bg-card border border-border group-hover:border-foreground/20 transition-colors">
              <Coffee className="w-8 h-8" />
            </div>
            <span className="text-sm font-medium">Cafés</span>
          </div>
          
          <div className="flex flex-col items-center gap-3 group cursor-default">
            <div className="p-4 rounded-full bg-card border border-border group-hover:border-foreground/20 transition-colors">
              <Building2 className="w-8 h-8" />
            </div>
            <span className="text-sm font-medium">Hotels</span>
          </div>
          
          <div className="flex flex-col items-center gap-3 group cursor-default">
            <div className="p-4 rounded-full bg-card border border-border group-hover:border-foreground/20 transition-colors">
              <Users className="w-8 h-8" />
            </div>
            <span className="text-sm font-medium">Casual Dining</span>
          </div>
        </div>

        {/* Trust metrics */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl md:text-4xl font-bold mb-2">500+</div>
            <div className="text-sm text-muted-foreground">Active Menus</div>
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-bold mb-2">50K+</div>
            <div className="text-sm text-muted-foreground">Monthly Views</div>
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-bold mb-2">99.9%</div>
            <div className="text-sm text-muted-foreground">Uptime</div>
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-bold mb-2">{'<100ms'}</div>
            <div className="text-sm text-muted-foreground">Load Speed</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
