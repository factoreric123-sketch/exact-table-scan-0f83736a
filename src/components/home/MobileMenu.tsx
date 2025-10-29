import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  scrollToSection: (id: string) => void;
}

const MobileMenu = ({ isOpen, onClose, scrollToSection }: MobileMenuProps) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/95 backdrop-blur-lg"
        onClick={onClose}
      />

      {/* Menu Content */}
      <div className="relative h-full flex flex-col p-6 animate-fade-in">
        <div className="flex flex-col gap-6 mt-16">
          <button
            onClick={() => scrollToSection("features")}
            className="text-2xl font-semibold text-foreground hover:text-accent transition-colors text-left"
          >
            Features
          </button>
          <button
            onClick={() => scrollToSection("demo")}
            className="text-2xl font-semibold text-foreground hover:text-accent transition-colors text-left"
          >
            Demo
          </button>
          <Link
            to="/auth"
            className="text-2xl font-semibold text-foreground hover:text-accent transition-colors"
            onClick={onClose}
          >
            Sign In
          </Link>

          <div className="mt-8 flex flex-col gap-4">
            <Button
              onClick={() => {
                navigate("/auth?signup=true");
                onClose();
              }}
              size="lg"
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-lg h-14"
            >
              Start Free Trial
            </Button>
            <Button
              onClick={() => {
                navigate("/demo");
                onClose();
              }}
              variant="outline"
              size="lg"
              className="w-full text-lg h-14"
            >
              View Demo Menu
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;
