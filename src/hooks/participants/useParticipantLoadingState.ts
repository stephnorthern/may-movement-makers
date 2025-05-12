
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook for managing participant loading states and connection checking
 */
export const useParticipantLoadingState = () => {
  // Additional state to track if initial loading attempt completed
  const [initialLoadAttempted, setInitialLoadAttempted] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);
  const [loadAttempts, setLoadAttempts] = useState(0);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  
  // Check Supabase connection
  useEffect(() => {
    const checkConnection = async () => {
      try {
        console.log("Checking Supabase connection...");
        
        // First try a simple query that should always work if the service is up
        const { data, error } = await supabase
          .from('teams')
          .select('count')
          .limit(1)
          .timeout(5000); // Add timeout to prevent hanging
        
        if (error) {
          console.error("Supabase connection error:", error);
          
          // More extensive network error detection
          const errorMessage = error.message.toLowerCase();
          const isNetworkError = errorMessage.includes('failed to fetch') || 
                               errorMessage.includes('network') ||
                               errorMessage.includes('connection') ||
                               errorMessage.includes('timeout') ||
                               errorMessage.includes('cors') ||
                               navigator.onLine === false;
          
          setIsConnected(false);
          
          if (isNetworkError) {
            console.log("Network connection issue detected");
            toast.error("Database connection error: Network connection issue");
            setLoadError(new Error("Network connectivity issue. Please check your internet connection."));
          } else {
            console.log("Database error detected:", error.message);
            toast.error(`Database connection error: ${error.message}`);
            setLoadError(new Error(`Database connection error: ${error.message}`));
          }
        } else {
          console.log("Supabase connection successful:", data);
          setIsConnected(true);
          setLoadError(null);
        }
      } catch (err) {
        console.error("Failed to check Supabase connection:", err);
        setIsConnected(false);
        toast.error("Failed to connect to database - check your network connection");
        setLoadError(new Error("Failed to connect to database - possible network connectivity issue"));
      }
    };
    
    // Initial check
    checkConnection();
    
    // Set up an interval to periodically check connection (every 30 seconds)
    const intervalId = setInterval(checkConnection, 30000);
    
    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, []);
  
  // Retry connection method
  const retryConnection = useCallback(async () => {
    try {
      toast.info("Checking database connection...");
      const { data, error } = await supabase.from('teams').select('count').limit(1);
      
      if (error) {
        setIsConnected(false);
        setLoadError(new Error(`Database connection failed: ${error.message}`));
        toast.error("Database connection still unavailable");
        return false;
      } else {
        setIsConnected(true);
        setLoadError(null);
        toast.success("Database connection restored!");
        return true;
      }
    } catch (err) {
      setIsConnected(false);
      setLoadError(err instanceof Error ? err : new Error("Connection check failed"));
      toast.error("Failed to check database connection");
      return false;
    }
  }, []);
  
  return {
    initialLoadAttempted,
    setInitialLoadAttempted,
    loadError,
    setLoadError,
    loadAttempts,
    setLoadAttempts,
    isConnected,
    retryConnection
  };
};
