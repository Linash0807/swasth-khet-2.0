import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sprout, Menu } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";

export const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const isLandingPage = location.pathname === "/";

  const allNavItems = [
    { label: "Home", href: user ? "/dashboard" : "/" },
    { label: "Chatbot", href: "/chatbot" },
    { label: "Market", href: "/marketplace" },
    { label: "Map", href: "/map" },
    { label: "Recognition", href: "/disease-detection" },
    { label: "Weather", href: "/weather" },
    { label: "Features", href: "/#features", isAnchor: true },
    { label: "Contact", href: "/#contact", isAnchor: true },
  ];

  const navItems = isLandingPage
    ? allNavItems.filter(item => ["Home", "Features", "Contact"].includes(item.label))
    : allNavItems.filter(item => !["Features", "Contact"].includes(item.label));

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-primary text-primary-foreground shadow-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to={user ? "/dashboard" : "/"} className="flex items-center space-x-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 shadow-md">
            <Sprout className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-wider">SwasthKhet</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {navItems.map((item) => (
            item.isAnchor ? (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-medium opacity-90 hover:opacity-100 transition-smooth"
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.href}
                to={item.href}
                className="text-sm font-medium opacity-90 hover:opacity-100 transition-smooth"
              >
                {item.label}
              </Link>
            )
          ))}
        </nav>

        <div className="flex items-center space-x-4">
          {!user && (
            <Button variant="ghost" asChild className="hidden md:inline-flex border-white/20 hover:bg-white/10">
              <Link to="/login">Login</Link>
            </Button>
          )}
          {isLandingPage && !user ? (
            <Button variant="hero" size="default" asChild>
              <Link to="/register">Register</Link>
            </Button>
          ) : user ? (
            <Button variant="hero" size="default" onClick={() => logout()}>
              Logout
            </Button>
          ) : (
            <Button variant="hero" size="default" asChild>
              <Link to="/login">Get Started</Link>
            </Button>
          )}

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-primary text-primary-foreground border-white/10">
              <nav className="flex flex-col space-y-4 mt-8">
                {navItems.map((item) => (
                  item.isAnchor ? (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="text-lg font-medium opacity-90 hover:opacity-100 transition-smooth"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setIsOpen(false)}
                      className="text-lg font-medium opacity-90 hover:opacity-100 transition-smooth"
                    >
                      {item.label}
                    </Link>
                  )
                ))}
                <div className="flex flex-col space-y-2 pt-4 border-t border-white/10">
                  {!user ? (
                    <>
                      <Link
                        to="/login"
                        onClick={() => setIsOpen(false)}
                        className="text-lg font-medium opacity-90 hover:opacity-100 transition-smooth"
                      >
                        Login
                      </Link>
                      <Link
                        to="/register"
                        onClick={() => setIsOpen(false)}
                        className="text-lg font-medium text-white transition-smooth"
                      >
                        Register
                      </Link>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        logout();
                        setIsOpen(false);
                      }}
                      className="text-left text-lg font-medium text-white transition-smooth"
                    >
                      Logout
                    </button>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
