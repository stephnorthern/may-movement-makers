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
  
  // Add this to track loading state
  const isLoadingRef = useRef(false);
  
  /**
   * Begin loading process and setup safety timeout
   */
  const startLoading = useCallback(() => {
    if (!isMountedRef.current || isLoadingRef.current) return;
    
    console.log("Starting loading process");
    isLoadingRef.current = true;
    setIsLoading(true);
    
    // Clear any existing timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    
    // Set a new timeout
    loadingTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        console.log("Loading timeout reached - resetting loading state");
        isLoadingRef.current = false;
        setIsLoading(false);
      }
    }, 10000);
  }, [setIsLoading]);
  
  /**
   * End loading process and clear timeouts
   */
  const endLoading = useCallback(() => {
    if (isMountedRef.current) {
      console.log("Ending loading process");
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [setIsLoading]);
  
  /**
   * Cleanup resources on unmount
   */
  const cleanupResources = useCallback(() => {
    console.log("Cleaning up resources");
    isMountedRef.current = false;
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
    isLoadingRef.current = false;
  }, []);
  
  return {
    isMountedRef,
    loadFailedRef,
    initialLoadCompleteRef,
    isLoadingRef, // Export this for external use
    startLoading,
    endLoading,
    cleanupResources
  };
};
