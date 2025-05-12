
import { useRef, useCallback } from "react";

/**
 * Hook to manage loading state and timeouts
 */
export const useLoadingState = (setIsLoading: (loading: boolean) => void) => {
  // Ref to track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);
  
  // Add a ref to track failed loads for retry logic
  const loadFailedRef = useRef(false);
  
  // Add a timeout ref to track loading state and clear stuck states
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Ref to track if initial data load has completed
  const initialLoadCompleteRef = useRef(false);
  
  /**
   * Begin loading process and setup safety timeout
   */
  const startLoading = useCallback(() => {
    if (!isMountedRef.current) return;
    
    setIsLoading(true);
    
    // Set a timeout to clear loading state if it gets stuck
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    
    // Reset loading state after 10 seconds to prevent stuck loading indicators
    loadingTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        setIsLoading(false);
        console.log("Loading timeout reached - resetting loading state");
      }
    }, 10000);
  }, [setIsLoading]);
  
  /**
   * End loading process and clear timeouts
   */
  const endLoading = useCallback(() => {
    if (isMountedRef.current) {
      // Clear the loading timeout
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      
      // Ensure loading state is always turned off
      setIsLoading(false);
    }
  }, [setIsLoading]);
  
  /**
   * Cleanup resources on unmount
   */
  const cleanupResources = useCallback(() => {
    isMountedRef.current = false;
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
  }, []);
  
  return {
    isMountedRef,
    loadFailedRef,
    initialLoadCompleteRef,
    startLoading,
    endLoading,
    cleanupResources
  };
};
