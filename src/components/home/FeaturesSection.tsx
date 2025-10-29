import { Palette, Smartphone, Zap, Lock, BarChart3, Globe } from "lucide-react";

const features = [
  {
    icon: Palette,
    title: "Beautiful Themes",
    description: "10+ premium themes designed by professionals. Customize colors, fonts, and layouts to match your brand perfectly.",
  },
  {
    icon: Smartphone,
    title: "Mobile-First Design",
    description: "Optimized for every device. Your menu looks stunning on phones, tablets, and desktops automatically.",
  },
  {
    icon: Zap,
    title: "Blazing Fast",
    description: "Lightning-fast loading times under 100ms. Your customers get instant access to your menu.",
  },
  {
    icon: Lock,
    title: "Secure & Reliable",
    description: "Enterprise-grade security with 99.9% uptime. Your data is protected and always accessible.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Track menu views, popular items, and customer behavior. Make data-driven decisions for your restaurant.",
  },
  {
    icon: Globe,
    title: "Multi-Language Support",
    description: "Reach international customers with multi-language menus. Easy translation management built-in.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 lg:py-32 bg-muted/30">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in-up">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Everything You Need to{" "}
            <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
              Succeed
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Powerful features designed for modern restaurants. No technical knowledge required.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group p-6 rounded-xl bg-card border border-border hover:border-accent/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                  <Icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
