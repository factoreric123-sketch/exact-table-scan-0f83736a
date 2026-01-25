import { Palette, Image, Filter, QrCode } from "lucide-react";

const features = [
  {
    icon: Palette,
    title: "20+ Premium Themes",
    description: "Professionally designed themes with custom fonts, colors, and styles.",
  },
  {
    icon: Image,
    title: "Photos That Sell",
    description: "High-quality dish images with flexible card layouts.",
  },
  {
    icon: Filter,
    title: "Allergen & Dietary Filters",
    description: "Gluten-free, vegan, spicy — customers find what works for them.",
  },
  {
    icon: QrCode,
    title: "QR Codes in Seconds",
    description: "Generate, download, and print. Place on tables and go.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-20 lg:py-24">
      <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="p-6 rounded-2xl bg-card border border-border"
              >
                <div className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center mb-5">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;