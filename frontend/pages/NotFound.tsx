import { useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container flex h-16 items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
                {/* Leaf */}
                <path d="M12 2C12 2 8 6 8 12C8 16.4183 9.79086 20 12 20C14.2091 20 16 16.4183 16 12C16 6 12 2 12 2Z" fill="currentColor" />
                {/* Gear */}
                <g transform="translate(14, 12) scale(0.6)">
                  <circle cx="0" cy="0" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
                  <circle cx="0" cy="0" r="1.5" fill="currentColor" />
                  <g>
                    <rect x="-1" y="-6" width="2" height="2" fill="currentColor" />
                    <rect x="4.2" y="-4.2" width="2" height="2" fill="currentColor" transform="rotate(45 5.2 -3.2)" />
                    <rect x="6" y="-1" width="2" height="2" fill="currentColor" />
                    <rect x="4.2" y="4.2" width="2" height="2" fill="currentColor" transform="rotate(45 5.2 5.2)" />
                    <rect x="-1" y="6" width="2" height="2" fill="currentColor" />
                    <rect x="-6.2" y="4.2" width="2" height="2" fill="currentColor" transform="rotate(45 -5.2 5.2)" />
                    <rect x="-8" y="-1" width="2" height="2" fill="currentColor" />
                    <rect x="-6.2" y="-4.2" width="2" height="2" fill="currentColor" transform="rotate(45 -5.2 -3.2)" />
                  </g>
                </g>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Precision AgroGuard</h1>
              <p className="text-xs text-muted-foreground">AI Spraying System</p>
            </div>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container flex-1 flex items-center justify-center py-12">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-lg bg-destructive/10 mb-6">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-3">404</h1>
          <p className="text-lg text-muted-foreground mb-2">
            Page not found
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/">
              <Button className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
                <Home className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="outline" className="w-full sm:w-auto">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NotFound;
