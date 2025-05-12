
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Hook for handling realtime updates from Supabase with improved debouncing and error handling
 */
export const useRealtimeUpdates = (loadData: (forceFresh?: boolean) => Promise<boolean | void>) => {
  // Track subscription status
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  
  // Use a ref to track if data loading is already in progress
  const isLoadingRef = useRef(false);
  
  // Track last update time to prevent too frequent updates
  const lastUpdateTimeRef = useRef(Date.now());
  
  // Minimum time between updates in milliseconds (1500ms debounce)
  const UPDATE_DEBOUNCE_TIME = 1500;
  
  // Timeout ref for debouncing
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Track events in a batch during debounce period
  const pendingEventsRef = useRef<Set<string>>(new Set());
  
  // Success tracking to prevent stuck loading states
  const successfulLoadRef = useRef<boolean>(true);
  
  // Track connection errors
  const [connectionError, setConnectionError] = useState<Error | null>(null);
  
  // Function to safely trigger data loading with improved debouncing
  const safeLoadData = (source?: string) => {
    // If a source is provided, add it to the pending events
    if (source) {
      pendingEventsRef.current.add(source);
    }
    
    // Clear any pending update timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = null;
    }
    
    // Check if we've updated recently
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateTimeRef.current;
    
    if (isLoadingRef.current) {
      // Skip if already loading, but ensure we schedule a follow-up check
      updateTimeoutRef.current = setTimeout(() => {
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
      
      updateTimeoutRef.current = setTimeout(() => {
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
      setConnectionError(null);
      
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
      setConnectionError(error instanceof Error ? error : new Error('Unknown error during data load'));
    } finally {
      // Always set loading to false to prevent stuck loading states
      isLoadingRef.current = false;
      
      // Check if we need to schedule another update, but with a minimum delay
      if (pendingEventsRef.current.size > 0) {
        updateTimeoutRef.current = setTimeout(() => {
          if (pendingEventsRef.current.size > 0) {
            performDataLoad();
          }
        }, UPDATE_DEBOUNCE_TIME);
      }
    }
  };

  useEffect(() => {
    // Initial load to ensure we have data
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
      .subscribe((status) => {
        console.log(`Participants channel status: ${status}`);
        setSubscriptionStatus(status);
        
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to participants table changes');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Error subscribing to participants table changes');
          setConnectionError(new Error('Failed to connect to realtime updates'));
        }
      });
    
    const activitiesChannel = supabase
      .channel('public:activities')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'activities' },
        () => {
          safeLoadData('activities');
        }
      )
      .subscribe((status) => {
        console.log(`Activities channel status: ${status}`);
      });
    
    const teamsChannel = supabase
      .channel('public:teams')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'teams' },
        () => {
          safeLoadData('teams');
        }
      )
      .subscribe((status) => {
        console.log(`Teams channel status: ${status}`);
      });
    
    const teamMembersChannel = supabase
      .channel('public:team_members')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'team_members' },
        () => {
          safeLoadData('team_members');
        }
      )
      .subscribe((status) => {
        console.log(`Team members channel status: ${status}`);
      });
    
    // Create a watchdog timer to detect and fix stuck loading states
    const watchdogTimer = setInterval(() => {
      if (isLoadingRef.current) {
        const loadingDuration = Date.now() - lastUpdateTimeRef.current;
        // If loading for over 10 seconds, reset the loading state
        if (loadingDuration > 10000) {
          console.warn('Detected stuck loading state, resetting...');
          isLoadingRef.current = false;
        }
      }
    }, 3000); // Check every 3 seconds
    
    // Periodically check connection status
    const connectionCheckTimer = setInterval(() => {
      if (subscriptionStatus !== 'SUBSCRIBED') {
        console.log('Checking Supabase connection...');
        // Force a refresh of data
        safeLoadData('connection-check');
      }
    }, 30000); // Check every 30 seconds
    
    return () => {
      // Clean up subscriptions and timers
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      
      clearInterval(watchdogTimer);
      clearInterval(connectionCheckTimer);
      
      supabase.removeChannel(participantsChannel);
      supabase.removeChannel(activitiesChannel);
      supabase.removeChannel(teamsChannel);
      supabase.removeChannel(teamMembersChannel);
    };
  }, [loadData]);
  
  // Return the current loading state and connection status for external components to use
  return {
    isLoadingData: isLoadingRef.current,
    loadComplete: successfulLoadRef.current,
    subscriptionStatus,
    connectionError
  };
};
