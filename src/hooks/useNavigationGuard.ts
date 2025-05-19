
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Hook to prevent unwanted navigation away from protected routes
 * @param protectedPath - The path that should be protected from unwanted navigation
 * @param isLoading - Whether data is currently loading or in a critical state
 */
export const useNavigationGuard = (protectedPath: string, isLoading: boolean) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Only apply navigation protection when we're on the protected path and loading
    if (location.pathname === protectedPath && isLoading) {
      console.log(`Navigation guard active for ${protectedPath} - isLoading: ${isLoading}`);
      
      // Set a flag in sessionStorage to track that we're intentionally on this page
      sessionStorage.setItem(`viewing_${protectedPath.replace('/', '')}`, 'true');
      
      // Create a beforeunload listener to prevent leaving the page during loading
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        if (isLoading) {
          // Standard way to show a confirmation dialog before leaving
          e.preventDefault();
          e.returnValue = ''; // Chrome requires returnValue to be set
          return '';
        }
      };
      
      // Add the beforeunload listener
      window.addEventListener('beforeunload', handleBeforeUnload);
      
      // Create a history listener to catch navigation attempts
      const handlePopState = (e: PopStateEvent) => {
        // If we're loading data, try to prevent navigation
        if (isLoading) {
          e.preventDefault();
          console.log("Prevented navigation during data loading");
          // Force redirect back to the protected page
          navigate(protectedPath, { replace: true });
        }
      };
      
      window.addEventListener('popstate', handlePopState);
      
      // Set up a counter to check if we're still on the page after a short delay
      // This catches "soft" navigations that the popstate doesn't catch
      const checkInterval = setInterval(() => {
        if (isLoading && location.pathname !== protectedPath) {
          console.log("Detected soft navigation while loading, redirecting back");
          navigate(protectedPath, { replace: true });
        }
      }, 500);
      
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        window.removeEventListener('popstate', handlePopState);
        clearInterval(checkInterval);
        
        // Only remove the flag if we're actually navigating away from the page
        // This check prevents removing the flag during re-renders
        if (location.pathname !== protectedPath) {
          sessionStorage.removeItem(`viewing_${protectedPath.replace('/', '')}`);
        }
      };
    }
  }, [location.pathname, protectedPath, isLoading, navigate]);
};
