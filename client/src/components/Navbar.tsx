import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Trophy, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/api/useAuth";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api";

export const Navbar = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Fetch settings for site title and icon
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: api.getSettings,
    retry: 1,
  });

  const siteTitle = settings?.siteTitle || "FOF 2026";
  const siteIconUrl = settings?.siteIconUrl;

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/calendar", label: "Calendar" },
    { to: "/sports", label: "Sports" },
    { to: "/communities", label: "Communities" },
    { to: "/leaderboard", label: "Leaderboard" },
    { to: "/contact", label: "Contact" },
    { to: "/terms", label: "Terms" },
  ];

  const isActive = (path: string) => location.pathname === path;

  const navLinkClass = (path: string) =>
    `text-sm font-medium transition-colors duration-200 rounded-md px-1 py-0.5 hover:text-primary focus-visible:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
      isActive(path) ? "text-primary" : "text-muted-foreground"
    }`;

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center gap-2">
          {/* Left: Brand */}
          <div className="flex shrink-0 items-center justify-start">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl">
              {siteIconUrl ? (
                <img src={siteIconUrl} alt="Site Icon" className="h-10 w-10 object-contain" />
              ) : (
                <Trophy className="h-6 w-6 text-primary" />
              )}
              <span className="hidden sm:inline">{siteTitle}</span>
            </Link>
          </div>

          {/* Center: Desktop Navigation */}
          <div className="relative z-10 hidden min-w-0 flex-1 md:flex md:items-center md:justify-center">
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 lg:gap-x-6">
              {navLinks.map((link) => (
                <Link key={link.to} to={link.to} className={navLinkClass(link.to)}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right: Desktop Actions */}
          <div className="relative z-0 hidden shrink-0 md:flex md:items-center md:justify-end">
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
                  className={navLinkClass(link.to)}
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
    case "sports_super_admin":
      return "/sports-super-admin";
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
  const auth = useAuth();
  const user = auth?.user || null;
  const logout = auth?.logout || (async () => {});
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
  const auth = useAuth();
  const user = auth?.user || null;
  const logout = auth?.logout || (async () => {});
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
