import { Palette, Smartphone, Zap, QrCode, Filter, Move } from "lucide-react";

const features = [
  {
    icon: Palette,
    title: "10+ Premium Themes",
    description: "Professionally designed themes that make your menu stand out. Customize every detail to match your brand identity.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Under 100ms load times guaranteed. Your customers access menus instantly with zero frustration.",
  },
  {
    icon: QrCode,
    title: "QR Code Ready",
    description: "Generate professional QR codes instantly. Print and place them on tables for seamless contactless ordering.",
  },
  {
    icon: Filter,
    title: "Smart Filtering",
    description: "Filter by allergens, dietary preferences, and spiciness. Help customers find exactly what they're looking for.",
  },
  {
    icon: Move,
    title: "Drag & Drop Editor",
    description: "Reorganize your entire menu in seconds. Intuitive interface that anyone can master in minutes.",
  },
  {
    icon: Smartphone,
    title: "Mobile Perfection",
    description: "Flawless experience on every device. Your menu adapts automatically to any screen size.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 lg:py-32">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20 animate-fade-in-up">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Everything you need.{" "}
            <span className="block">Nothing you don't.</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Built for restaurant owners who want results, not complexity.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-foreground text-background flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
