import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook for handling realtime updates from Supabase with debouncing
 */
export const useRealtimeUpdates = (loadData: () => Promise<void>) => {
  // Use a ref to track if data loading is already in progress
  const isLoadingRef = useRef(false);
  
  // Track last update time to prevent too frequent updates
  const lastUpdateTimeRef = useRef(Date.now());
  
  // Minimum time between updates in milliseconds (300ms debounce)
  const UPDATE_DEBOUNCE_TIME = 300;
  
  // Timeout ref for debouncing
  const updateTimeoutRef = useRef<number | null>(null);
  
  // Function to safely trigger data loading with debouncing
  const safeLoadData = () => {
    // Clear any pending update timeout
    if (updateTimeoutRef.current) {
      window.clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = null;
    }
    
    // Check if we've updated recently
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateTimeRef.current;
    
    if (isLoadingRef.current) {
      console.log('Skipping duplicate data reload request - already loading');
      return;
    }
    
    // If we've updated too recently, set a timeout to update after debounce period
    if (timeSinceLastUpdate < UPDATE_DEBOUNCE_TIME) {
      const delayTime = UPDATE_DEBOUNCE_TIME - timeSinceLastUpdate;
      console.log(`Debouncing update request by ${delayTime}ms`);
      
      updateTimeoutRef.current = window.setTimeout(() => {
        performDataLoad();
      }, delayTime);
      return;
    }
    
    // Otherwise perform the update immediately
    performDataLoad();
  };
  
  // The actual data loading function
  const performDataLoad = async () => {
    try {
      isLoadingRef.current = true;
      console.log('Loading data from Supabase');
      await loadData();
      lastUpdateTimeRef.current = Date.now();
    } catch (error) {
      console.error('Error during realtime data reload:', error);
    } finally {
      isLoadingRef.current = false;
    }
  };

  useEffect(() => {
    // Initial load
    safeLoadData();
    
    // Set up Supabase realtime subscriptions with debouncing
    const participantsChannel = supabase
      .channel('public:participants')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'participants' },
        () => {
          console.log('Participants table updated, requesting data reload');
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
          console.log('Activities table updated, requesting data reload');
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
          console.log('Teams table updated, requesting data reload');
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
          console.log('Team members table updated, requesting data reload');
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
      // Clean up subscriptions and timeout
      if (updateTimeoutRef.current) {
        window.clearTimeout(updateTimeoutRef.current);
      }
      
      supabase.removeChannel(participantsChannel);
      supabase.removeChannel(activitiesChannel);
      supabase.removeChannel(teamsChannel);
      supabase.removeChannel(teamMembersChannel);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [loadData]);
};
