import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import MobileMenu from "./MobileMenu";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    // If we're on the homepage, scroll directly
    if (location.pathname === "/") {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
        setIsMobileMenuOpen(false);
      }
    } else {
      // Navigate to homepage with scroll parameter
      navigate(`/?scrollTo=${id}`);
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-background/95 backdrop-blur-lg border-b border-border shadow-sm"
            : "bg-transparent"
        }`}
      >
        <nav className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <img src="/logo.png" alt="menu" className="h-8 lg:h-10 group-hover:scale-105 transition-transform" />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              <button
                onClick={() => scrollToSection("features")}
                className="text-foreground/80 hover:text-foreground transition-colors text-sm font-medium"
              >
                Features
              </button>
              <Link
                to="/demo"
                className="text-foreground/80 hover:text-foreground transition-colors text-sm font-medium"
              >
                Demo
              </Link>
              <Link
                to="/pricing"
                className="text-foreground/80 hover:text-foreground transition-colors text-sm font-medium"
              >
                Pricing
              </Link>
              <Link
                to="/contact"
                className="text-foreground/80 hover:text-foreground transition-colors text-sm font-medium"
              >
                Contact
              </Link>
            </div>

            {/* Desktop CTA */}
            <div className="hidden lg:flex items-center gap-4">
              <Button
                onClick={() => navigate("/auth?signup=true")}
                size="lg"
                className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                Start Free Trial
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-foreground hover:text-accent transition-colors"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        scrollToSection={scrollToSection}
      />
    </>
  );
};

export default Navbar;
