import { Link } from "react-router-dom";
import { Sprout } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary shadow-md">
                <Sprout className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">Swasth Khet</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Empowering farmers with AI-powered technology for sustainable and profitable agriculture.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Platform</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="#features" className="hover:text-foreground transition-smooth">Features</Link></li>
              <li><Link to="/dashboard" className="hover:text-foreground transition-smooth">Dashboard</Link></li>
              <li><Link to="#" className="hover:text-foreground transition-smooth">Pricing</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="#" className="hover:text-foreground transition-smooth">Documentation</Link></li>
              <li><Link to="#" className="hover:text-foreground transition-smooth">Help Center</Link></li>
              <li><Link to="#" className="hover:text-foreground transition-smooth">Blog</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="#about" className="hover:text-foreground transition-smooth">About Us</Link></li>
              <li><Link to="#contact" className="hover:text-foreground transition-smooth">Contact</Link></li>
              <li><Link to="#" className="hover:text-foreground transition-smooth">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Swasth Khet. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
