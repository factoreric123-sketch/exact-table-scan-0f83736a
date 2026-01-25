import { Palette, Smartphone, Zap, QrCode, Filter, Move, Image, Utensils, LayoutGrid, Undo2 } from "lucide-react";

const features = [
  {
    icon: Palette,
    title: "20+ Premium Themes",
    description: "From Dark Elegance to Sage & Cream — professionally designed themes with custom fonts, colors, and styles.",
  },
  {
    icon: Image,
    title: "Photos That Sell",
    description: "High-quality dish images with flexible layouts. Square or vertical cards, text overlays, your choice.",
  },
  {
    icon: Filter,
    title: "Allergen & Dietary Filters",
    description: "Gluten-free, vegan, spicy levels, nut allergies — customers filter to find exactly what works for them.",
  },
  {
    icon: Move,
    title: "Drag & Drop Everything",
    description: "Reorder categories, subcategories, and dishes instantly. Spreadsheet view for bulk edits.",
  },
  {
    icon: QrCode,
    title: "QR Codes in Seconds",
    description: "Generate, download, and print QR codes. Place on tables and let customers scan to view.",
  },
  {
    icon: Zap,
    title: "Under 100ms Load",
    description: "Edge-optimized delivery. Your menu loads before customers even look up from scanning.",
  },
  {
    icon: Utensils,
    title: "Options & Add-ons",
    description: "Size variations, modifiers, extras — show all pricing options clearly on every dish.",
  },
  {
    icon: Undo2,
    title: "Undo/Redo + Preview",
    description: "Ctrl+Z works. Preview mode shows exactly what customers see. No surprises.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 lg:py-32">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20 animate-fade-in-up">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            A better menu,{" "}
            <span className="block">in every way.</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Better clarity. Better service.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group animate-fade-in-up p-6 rounded-2xl bg-card border border-border hover:border-foreground/20 transition-colors"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex flex-col gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-foreground text-background flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
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
