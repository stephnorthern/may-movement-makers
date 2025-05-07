
import { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import AuthHeader from "@/components/auth/AuthHeader";
import LoginForm from "@/components/auth/LoginForm";
import SignupForm from "@/components/auth/SignupForm";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { user, loading } = useAuth();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  useEffect(() => {
    // Show a message if user was redirected here
    if (location.state?.from) {
      toast.info("Please sign in to access the application");
    }
  }, [location.state]);

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
  };

  // Redirect if user is already authenticated
  if (user && !loading) {
    return <Navigate to={from} replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <AuthHeader isLogin={isLogin} onToggleMode={toggleAuthMode} />
        
        {isLogin ? (
          <LoginForm />
        ) : (
          <SignupForm />
        )}
      </div>
    </div>
  );
};

export default Auth;
