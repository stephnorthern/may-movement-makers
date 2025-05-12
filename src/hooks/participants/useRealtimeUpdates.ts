
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Hook for handling realtime updates from Supabase with improved debouncing
 */
export const useRealtimeUpdates = (loadData: () => Promise<void>) => {
  // Use a ref to track if data loading is already in progress
  const isLoadingRef = useRef(false);
  
  // Track last update time to prevent too frequent updates
  const lastUpdateTimeRef = useRef(Date.now());
  
  // Minimum time between updates in milliseconds (2000ms debounce - increased from 1500ms)
  const UPDATE_DEBOUNCE_TIME = 2000;
  
  // Timeout ref for debouncing
  const updateTimeoutRef = useRef<number | null>(null);
  
  // Track events in a batch during debounce period
  const pendingEventsRef = useRef<Set<string>>(new Set());
  
  // Success tracking to prevent stuck loading states
  const successfulLoadRef = useRef<boolean>(true);
  
  // Function to safely trigger data loading with improved debouncing
  const safeLoadData = (source?: string) => {
    // If a source is provided, add it to the pending events
    if (source) {
      pendingEventsRef.current.add(source);
    }
    
    // Clear any pending update timeout
    if (updateTimeoutRef.current) {
      window.clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = null;
    }
    
    // Check if we've updated recently
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateTimeRef.current;
    
    if (isLoadingRef.current) {
      // Skip if already loading, but ensure we schedule a follow-up check
      updateTimeoutRef.current = window.setTimeout(() => {
        // Only reload if we have pending events and not already loading
        if (pendingEventsRef.current.size > 0 && !isLoadingRef.current) {
          performDataLoad();
        }
      }, UPDATE_DEBOUNCE_TIME);
      return;
    }
    
    // If we've updated too recently, set a timeout to update after debounce period
    if (timeSinceLastUpdate < UPDATE_DEBOUNCE_TIME) {
      const delayTime = UPDATE_DEBOUNCE_TIME - timeSinceLastUpdate;
      
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
    if (isLoadingRef.current) {
      return; // Double-check to prevent concurrent loads
    }
    
    try {
      isLoadingRef.current = true;
      
      // If we have pending events, log them
      if (pendingEventsRef.current.size > 0) {
        console.log(`Loading data from Supabase due to changes in: ${Array.from(pendingEventsRef.current).join(', ')}`);
        // Clear pending events as we're about to process them
        pendingEventsRef.current.clear();
      } else {
        console.log('Loading data from Supabase');
      }
      
      await loadData();
      lastUpdateTimeRef.current = Date.now();
      successfulLoadRef.current = true;
    } catch (error) {
      console.error('Error during realtime data reload:', error);
      successfulLoadRef.current = false;
      toast.error("Failed to refresh data");
    } finally {
      // Always set loading to false to prevent stuck loading states
      isLoadingRef.current = false;
      
      // Check if we need to schedule another update, but with a minimum delay
      if (pendingEventsRef.current.size > 0) {
        updateTimeoutRef.current = window.setTimeout(() => {
          if (pendingEventsRef.current.size > 0) {
            performDataLoad();
          }
        }, UPDATE_DEBOUNCE_TIME);
      }
    }
  };

  useEffect(() => {
    // Initial load - but don't mark as an event that would trigger further loads
    performDataLoad();
    
    // Set up Supabase realtime subscriptions with debouncing
    const participantsChannel = supabase
      .channel('public:participants')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'participants' },
        () => {
          safeLoadData('participants');
        }
      )
      .subscribe();
    
    const activitiesChannel = supabase
      .channel('public:activities')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'activities' },
        () => {
          safeLoadData('activities');
        }
      )
      .subscribe();
    
    const teamsChannel = supabase
      .channel('public:teams')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'teams' },
        () => {
          safeLoadData('teams');
        }
      )
      .subscribe();
    
    const teamMembersChannel = supabase
      .channel('public:team_members')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'team_members' },
        () => {
          safeLoadData('team_members');
        }
      )
      .subscribe();
    
    // Create a watchdog timer to detect and fix stuck loading states
    const watchdogTimer = window.setInterval(() => {
      if (isLoadingRef.current) {
        const loadingDuration = Date.now() - lastUpdateTimeRef.current;
        // If loading for over 10 seconds, reset the loading state
        if (loadingDuration > 10000) {
          console.warn('Detected stuck loading state, resetting...');
          isLoadingRef.current = false;
          toast.error("Loading timed out. Please refresh the page if data appears outdated.");
        }
      }
    }, 3000); // Check every 3 seconds
    
    return () => {
      // Clean up subscriptions and timers
      if (updateTimeoutRef.current) {
        window.clearTimeout(updateTimeoutRef.current);
      }
      
      window.clearInterval(watchdogTimer);
      
      supabase.removeChannel(participantsChannel);
      supabase.removeChannel(activitiesChannel);
      supabase.removeChannel(teamsChannel);
      supabase.removeChannel(teamMembersChannel);
    };
  }, [loadData]);
  
  // Return the current loading state for external components to use
  return {
    isLoadingData: isLoadingRef.current,
    loadComplete: successfulLoadRef.current
  };
};
