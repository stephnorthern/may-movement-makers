
import { useState, useEffect } from "react";
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
  
  // Check Supabase connection
  useEffect(() => {
    const checkConnection = async () => {
      try {
        console.log("Checking Supabase connection...");
        const { data, error } = await supabase.from('teams').select('count');
        
        if (error) {
          console.error("Supabase connection error:", error);
          toast.error(`Database connection error: ${error.message}`);
          setLoadError(new Error(`Database connection error: ${error.message}`));
        } else {
          console.log("Supabase connection successful:", data);
        }
      } catch (err) {
        console.error("Failed to check Supabase connection:", err);
        toast.error("Failed to connect to database");
        setLoadError(new Error("Failed to connect to database"));
      }
    };
    
    checkConnection();
  }, []);
  
  return {
    initialLoadAttempted,
    setInitialLoadAttempted,
    loadError,
    setLoadError,
    loadAttempts,
    setLoadAttempts
  };
};
