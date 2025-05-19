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
      // Only attempt load if we haven't loaded data yet
      if (participants.length > 0 || teams.length > 0) {
        setInitialLoadAttempted(true);
        return;
      }

      if (loadAttempts >= 3) {
        console.log('Max load attempts reached');
        return;
      }

      try {
        setIsLoading(true);
        setLoadError(null);
        
        await loadData(true);
        
        if (!isMounted) return;
        
        // Increment attempts but don't trigger retries automatically
        setLoadAttempts(loadAttempts + 1);
      } catch (error) {
        if (!isMounted) return;
        console.error('Error during initial data load:', error);
        setLoadError(error instanceof Error ? error : new Error('Unknown error loading data'));
      } finally {
        if (isMounted) {
          setInitialLoadAttempted(true);
          setIsLoading(false);
        }
      }
    };
    
    initialLoad();
    
    return () => {
      isMounted = false;
    };
  }, [loadData, setIsLoading, setLoadError, setInitialLoadAttempted, loadAttempts]);
};
