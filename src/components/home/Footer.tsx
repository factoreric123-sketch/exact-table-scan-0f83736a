import { Link } from "react-router-dom";
import { Github, Twitter, Linkedin, Mail } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted/30 border-t border-border py-12 lg:py-16">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2 group">
              <span className="text-2xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent group-hover:scale-105 transition-transform">
                menu
              </span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Transform your restaurant menu into a digital masterpiece. Fast, beautiful, and easy to use.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground "
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground "
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground "
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="mailto:hello@taptab.com"
                className="text-muted-foreground "
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Product</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/demo" >
                  Demo
                </Link>
              </li>
              <li>
                <a href="#features" >
                  Features
                </a>
              </li>
              <li>
                <Link to="/pricing" >
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/auth?signup=true" >
                  Sign Up
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Company</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/about" >
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/blog" >
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/careers" >
                  Careers
                </Link>
              </li>
              <li>
                <Link to="/contact" >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/privacy" >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/cookies" >
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link to="/gdpr" >
                  GDPR
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            © {currentYear} menu. All rights reserved.
            <p>Made for restaurants worldwide</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
