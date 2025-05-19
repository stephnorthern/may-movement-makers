/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect } from "react";
import { toast } from "sonner";

/**
 * Hook for handling initial data loading logic
 */
export const useParticipantInitialLoad = (
  loadData: (forceFresh: boolean) => Promise<any>,
  setIsLoading: (loading: boolean) => void,
  setLoadError: (error: Error | null) => void,
  setInitialLoadAttempted: (attempted: boolean) => void,
  loadAttempts: number,
  setLoadAttempts: (attempts: number) => void,
  participants: any[],
  teams: any[]
) => {
  useEffect(() => {
    let isMounted = true;
    
    const initialLoad = async () => {
      // If we already have data, just mark as attempted and return
      if (participants.length > 0 || teams.length > 0) {
        setInitialLoadAttempted(true);
        return;
      }

      // If we've hit max attempts, don't try again
      if (loadAttempts >= 3) {
        console.log('Max load attempts reached');
        setInitialLoadAttempted(true); // Make sure to mark as attempted
        return;
      }

      try {
        // Don't set loading state here, let the loadData function handle it
        setLoadError(null);
        
        await loadData(true);
        
        if (!isMounted) return;
        
        setLoadAttempts(loadAttempts + 1);
      } catch (error) {
        if (!isMounted) return;
        console.error('Error during initial data load:', error);
        setLoadError(error instanceof Error ? error : new Error('Unknown error loading data'));
      } finally {
        if (isMounted) {
          setInitialLoadAttempted(true);
        }
      }
    };
    
    // Only run initial load if we haven't attempted yet
    if (!participants.length && !teams.length) {
      initialLoad();
    }
    
    return () => {
      isMounted = false;
    };
  }, [loadData, setLoadError, setInitialLoadAttempted, loadAttempts]);
};
