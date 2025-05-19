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
  
  // Minimum time between updates in milliseconds (5 seconds debounce)
  const UPDATE_DEBOUNCE_TIME = 5000;
  
  // Timeout ref for debouncing
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Track which tables have changed
  const pendingUpdatesRef = useRef<Set<string>>(new Set());
  
  // Track channels
  const channelsRef = useRef<any[]>([]);
  
  // Simplified data loading with better error handling
  const performDataLoad = async () => {
    if (isLoadingRef.current) {
      console.log("Skipping data load - already in progress");
      return;
    }

    const now = Date.now();
    if (now - lastUpdateTimeRef.current < UPDATE_DEBOUNCE_TIME) {
      console.log("Skipping data load - too soon since last update");
      return;
    }

    try {
      isLoadingRef.current = true;
      // Only force fresh if we have pending updates
      const forceFresh = pendingUpdatesRef.current.size > 0;
      await loadData(forceFresh);
      lastUpdateTimeRef.current = now;
      pendingUpdatesRef.current.clear();
    } catch (error) {
      console.error('Error in realtime update:', error);
    } finally {
      isLoadingRef.current = false;
    }
  };

  // Debounced update handler
  const handleUpdate = (table: string) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    pendingUpdatesRef.current.add(table);
    
    updateTimeoutRef.current = setTimeout(() => {
      if (pendingUpdatesRef.current.size > 0) {
        performDataLoad();
      }
    }, UPDATE_DEBOUNCE_TIME);
  };

  useEffect(() => {
    // Create a single channel for all tables
    const channel = supabase.channel('db-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'participants' }, 
        () => handleUpdate('participants'))
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'activities' }, 
        () => handleUpdate('activities'))
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'teams' }, 
        () => handleUpdate('teams'))
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'team_members' }, 
        () => handleUpdate('team_members'))
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
        setSubscriptionStatus(status);
      });

    channelsRef.current = [channel];

    return () => {
      // Cleanup
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      
      // Unsubscribe from all channels
      channelsRef.current.forEach(channel => {
        if (channel) {
          channel.unsubscribe();
        }
      });
    };
  }, []);
  
  // Return the current loading state and connection status for external components to use
  return {
    isLoadingData: isLoadingRef.current,
    subscriptionStatus
  };
};
