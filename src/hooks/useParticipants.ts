
import { useEffect, useState } from "react";
import { useParticipantData } from "./participants/useParticipantData";
import { useTeamUtils } from "./participants/useTeamUtils";
import { useRealtimeUpdates } from "./participants/useRealtimeUpdates";
import { useParticipantsData } from "./participants/useParticipantsData";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

/**
 * Main hook for managing participants, their activities, and teams
 */
export const useParticipants = () => {
  const {
    participants,
    teams,
    participantActivities,
    isLoading,
    setIsLoading
  } = useParticipantData();
  
  // Additional state to track if initial loading attempt completed
  const [initialLoadAttempted, setInitialLoadAttempted] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);
  const [loadAttempts, setLoadAttempts] = useState(0);
  
  // Load data hook
  const {
    loadData,
    isMountedRef,
    cleanupResources
  } = useParticipantsData();
  
  // Set up realtime updates
  const { isLoadingData } = useRealtimeUpdates(loadData);

  // Verify Supabase connection
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
      }
    };
    
    checkConnection();
  }, []);
  
  // Load data on initial mount
  useEffect(() => {
    console.log("useParticipants effect: Setting up and loading initial data");
    isMountedRef.current = true;
    
    // Initial data load
    const initialLoad = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        
        // Force a direct fetch from Supabase instead of relying on cached data
        const result = await loadData(true);
        console.log("Initial data loaded successfully, result:", result);
        console.log("Participants count:", participants.length);
        console.log("Teams count:", teams.length);
        
        if (participants.length > 0 || teams.length > 0) {
          toast.success("Data loaded successfully");
        } else {
          console.log("No data found in database");
          // Try loading again if first attempt shows no data
          if (loadAttempts < 2) {
            setLoadAttempts(prev => prev + 1);
            setTimeout(() => {
              loadData(true);
            }, 2000);
          }
        }
      } catch (error) {
        console.error("Error during initial data load:", error);
        setLoadError(error instanceof Error ? error : new Error("Unknown error"));
        toast.error("Failed to load participant data");
      } finally {
        setInitialLoadAttempted(true);
        setIsLoading(false);
      }
    };
    
    initialLoad();
    
    // When component unmounts
    return () => {
      console.log("useParticipants cleanup");
      cleanupResources();
    };
  }, [loadData, isMountedRef, cleanupResources, setIsLoading, participants.length, teams.length, loadAttempts]);
  
  // Team utilities
  const { getTeamById } = useTeamUtils(teams);

  return {
    participants,
    teams,
    participantActivities,
    isLoading: isLoading || isLoadingData,
    initialLoadAttempted,
    loadError,
    loadData,
    getTeamById
  };
};
