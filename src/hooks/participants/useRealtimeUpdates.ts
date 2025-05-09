
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook for handling realtime updates from Supabase
 */
export const useRealtimeUpdates = (loadData: () => Promise<void>) => {
  // Use a ref to track if data loading is already in progress
  const isLoadingRef = useRef(false);
  
  // Function to safely trigger data loading
  const safeLoadData = async () => {
    if (isLoadingRef.current) {
      console.log('Skipping duplicate data reload request');
      return;
    }
    
    try {
      isLoadingRef.current = true;
      await loadData();
    } catch (error) {
      console.error('Error during realtime data reload:', error);
    } finally {
      isLoadingRef.current = false;
    }
  };

  useEffect(() => {
    // Initial load if needed
    if (!isLoadingRef.current) {
      safeLoadData();
    }
    
    // Set up Supabase realtime subscriptions with debouncing
    const participantsChannel = supabase
      .channel('public:participants')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'participants' },
        () => {
          console.log('Participants table updated, reloading data');
          safeLoadData();
        }
      )
      .subscribe();
    
    const activitiesChannel = supabase
      .channel('public:activities')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'activities' },
        () => {
          console.log('Activities table updated, reloading data');
          safeLoadData();
        }
      )
      .subscribe();
    
    const teamsChannel = supabase
      .channel('public:teams')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'teams' },
        () => {
          console.log('Teams table updated, reloading data');
          safeLoadData();
        }
      )
      .subscribe();
    
    const teamMembersChannel = supabase
      .channel('public:team_members')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'team_members' },
        () => {
          console.log('Team members table updated, reloading data');
          safeLoadData();
        }
      )
      .subscribe();
    
    // Also listen for storage events as a fallback
    const handleStorageChange = () => {
      safeLoadData();
    };
    
    window.addEventListener("storage", handleStorageChange);
    
    return () => {
      // Clean up subscribers
      supabase.removeChannel(participantsChannel);
      supabase.removeChannel(activitiesChannel);
      supabase.removeChannel(teamsChannel);
      supabase.removeChannel(teamMembersChannel);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [loadData]);
};
