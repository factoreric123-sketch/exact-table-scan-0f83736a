import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted/30 border-t border-border py-12 lg:py-16">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
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
            <p>© {currentYear} All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
