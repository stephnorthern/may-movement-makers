import { useState, useEffect, useRef } from "react";
import { Link, Outlet, useLocation, Navigate, useNavigate } from "react-router-dom";
import { Calendar, Trophy, Users, Activity, LogOut, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { Badge } from "@/components/ui/badge";
import { useParticipants } from "@/hooks/useParticipants";
import { getParticipantNameFromAuthId } from "@/lib/utils/participants";

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const navigationAttemptedRef = useRef(false);
  const currentPathRef = useRef(location.pathname);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, role, signOut, loading: authLoading } = useAuth();
  const { participants, isLoading: participantsLoading } = useParticipants();
  
  // Combined loading state
  const loading = authLoading || participantsLoading;

  // Combined loading state with a minimum duration
  const [showLoading, setShowLoading] = useState(true);
  useEffect(() => {
    if (!loading) {
      // Add a small delay before hiding loading screen to prevent flicker
      const timer = setTimeout(() => setShowLoading(false), 500);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Move all useEffects to the top level
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    currentPathRef.current = location.pathname;
    const viewingParticipants = sessionStorage.getItem('viewing_participants') === 'true';
    
    if (viewingParticipants && 
        location.pathname !== '/participants' && 
        !location.pathname.startsWith('/participants/') && 
        navigationAttemptedRef.current) {
      navigate('/participants', { replace: true });
      return;
    }
    
    navigationAttemptedRef.current = true;
  }, [location, navigate]);

  useEffect(() => {
    if (!loading && !user) {
      toast.error("Please sign in to access the application");
    }
  }, [user, loading]);

  // Early return for loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading...</h2>
          <p className="text-gray-600">Please wait while we set up your dashboard</p>
        </div>
      </div>
    );
  }

  // Early return for unauthenticated state
  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  const navItems = [
    { path: "/", label: "Dashboard", icon: <Trophy className="h-5 w-5" /> },
    { path: "/activities", label: "Activities", icon: <Activity className="h-5 w-5" /> },
    { path: "/participants", label: "Participants", icon: <Users className="h-5 w-5" /> },
    { path: "/calendar", label: "Calendar", icon: <Calendar className="h-5 w-5" /> },
  ];

  // Special handler for participants page navigation to ensure it stays on the page
  const handleNavigation = (path) => {
    if (path === '/participants') {
      // Clear any previous navigation flags except participants
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('viewing_') && key !== 'viewing_participants') {
          sessionStorage.removeItem(key);
        }
      });
      
      // Set the flag for participants page
      sessionStorage.setItem('viewing_participants', 'true');
      
      console.log("Navigation to participants page, setting viewing flag");
    } else {
      // Only clear participants flag when explicitly navigating elsewhere
      // and not when just rendering the layout
      if (currentPathRef.current === '/participants') {
        console.log("Explicit navigation away from participants page");
        sessionStorage.removeItem('viewing_participants');
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2" onClick={() => handleNavigation('/')}>
            <div className="bg-movement-purple text-white p-1 rounded-lg">
              <Activity className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold gradient-text">May Movement</h1>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-1.5 text-gray-600 hover:text-movement-purple transition-colors",
                  location.pathname === item.path && "text-movement-purple font-medium"
                )}
                onClick={() => handleNavigation(item.path)}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            {/* User display and logout - Always visible */}
            {user && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 hidden md:inline">
                  {loading ? "Loading..." : getParticipantNameFromAuthId(user.id, participants) || user.email}
                </span>
                {role === 'admin' && (
                  <Badge variant="secondary" className="mr-2">
                    <Shield className="h-3 w-3 mr-1" />
                    Admin
                  </Badge>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={signOut}
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden md:inline">Logout</span>
                </Button>
              </div>
            )}

            {/* Mobile menu button */}
            <button 
              className="md:hidden p-2 text-gray-500 hover:text-gray-800"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <nav className="md:hidden bg-white border-t border-gray-200 py-2">
            <div className="container mx-auto px-4 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-md text-gray-600 hover:bg-gray-100",
                    location.pathname === item.path && "bg-movement-light-purple text-movement-purple font-medium"
                  )}
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleNavigation(item.path);
                  }}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </header>
      
      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        <Outlet />
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          <p>May Movement Challenge 2025 • <span className="text-movement-purple">Ends June 2nd</span></p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
