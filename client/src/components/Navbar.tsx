import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Trophy, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/api/useAuth";

export const Navbar = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/calendar", label: "Calendar" },
    { to: "/sports", label: "Sports" },
    { to: "/communities", label: "Communities" },
    { to: "/contact", label: "Contact" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex md:grid md:grid-cols-3 h-16 items-center">
          {/* Left: Brand */}
          <div className="flex items-center justify-start">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl">
              <div className="bg-gradient-hero p-2 rounded-lg">
                <Trophy className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="hidden sm:inline">FOF 2026</span>
            </Link>
          </div>

          {/* Center: Desktop Navigation */}
          <div className="hidden md:flex items-center justify-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive(link.to) ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right: Desktop Actions */}
          <div className="hidden md:flex items-center justify-end">
            <DesktopActions />
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 ml-auto"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive(link.to) ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <MobileActions onClick={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

function getDashboardRoute(role: string): string | null {
  switch (role) {
    case "admin":
      return "/admin";
    case "community_admin":
      return "/community";
    case "sports_admin":
      return "/sports-admin";
    case "volunteer_admin":
      return "/volunteer-admin";
    case "user":
    case "volunteer":
      return "/dashboard";
    default:
      return null;
  }
}

function DesktopActions() {
  const { user, logout } = useAuth();
  const dashboardRoute = user ? getDashboardRoute(user.role) : null;
  
  return (
    <div className="hidden md:flex items-center gap-3">
      {user ? (
        <>
          {dashboardRoute && (
            <Button variant="ghost" asChild>
              <Link to={dashboardRoute}>Dashboard</Link>
            </Button>
          )}
          <Button variant="outline" onClick={() => logout()}>Logout</Button>
        </>
      ) : (
        <>
          <Button variant="ghost" asChild>
            <Link to="/login">Login</Link>
          </Button>
          <Button variant="hero" asChild>
            <Link to="/register">Register</Link>
          </Button>
        </>
      )}
    </div>
  );
}

function MobileActions({ onClick }: { onClick: () => void }) {
  const { user, logout } = useAuth();
  const dashboardRoute = user ? getDashboardRoute(user.role) : null;
  
  return (
    <div className="flex flex-col gap-2 pt-2">
      {user ? (
        <>
          {dashboardRoute && (
            <Button variant="ghost" asChild>
              <Link to={dashboardRoute} onClick={onClick}>Dashboard</Link>
            </Button>
          )}
          <Button variant="outline" onClick={() => { logout(); onClick() }}>Logout</Button>
        </>
      ) : (
        <>
          <Button variant="ghost" asChild>
            <Link to="/login" onClick={onClick}>Login</Link>
          </Button>
          <Button variant="hero" asChild>
            <Link to="/register" onClick={onClick}>Register</Link>
          </Button>
        </>
      )}
    </div>
  );
}
