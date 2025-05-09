
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook for handling realtime updates from Supabase
 */
export const useRealtimeUpdates = (loadData: () => Promise<void>) => {
  useEffect(() => {
    // Set up Supabase realtime subscriptions
    const participantsChannel = supabase
      .channel('public:participants')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'participants' },
        () => {
          console.log('Participants table updated, reloading data');
          loadData();
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
          loadData();
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
          loadData();
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
          loadData();
        }
      )
      .subscribe();
    
    // Also listen for storage events as a fallback
    const handleStorageChange = () => {
      loadData();
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
