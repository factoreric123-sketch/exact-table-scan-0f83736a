import { ReactNode, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "@/components/home/Navbar";
import Footer from "@/components/home/Footer";
import { Shield, FileText, Cookie, Scale } from "lucide-react";

interface LegalPageLayoutProps {
  children: ReactNode;
  title: string;
  lastUpdated: string;
  breadcrumbs?: Array<{ label: string; href: string }>;
  icon?: "shield" | "file" | "cookie" | "scale";
}

const iconMap = {
  shield: Shield,
  file: FileText,
  cookie: Cookie,
  scale: Scale,
};

const LegalPageLayout = ({ children, title, lastUpdated, icon = "file" }: LegalPageLayoutProps) => {
  const { pathname } = useLocation();
  const IconComponent = iconMap[icon];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-background via-background to-muted/20 border-b border-border">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/5 via-transparent to-transparent" />
        <div className="container mx-auto px-4 max-w-4xl py-16 md:py-24 relative">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-accent/10 border border-accent/20">
              <IconComponent className="w-8 h-8 text-accent" />
            </div>
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Legal Documentation
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            {title}
          </h1>
          <p className="text-lg text-muted-foreground">
            Last updated: <span className="text-foreground/80">{lastUpdated}</span>
          </p>
        </div>
      </div>

      {/* Content Section */}
      <main className="flex-1">
        <div className="container mx-auto px-4 max-w-4xl py-12 md:py-16">
          <div className="legal-content space-y-8">
          {children}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default LegalPageLayout;
