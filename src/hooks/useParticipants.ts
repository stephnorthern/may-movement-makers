
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useParticipantData } from "./participants/useParticipantData";
import { useTeamUtils } from "./participants/useTeamUtils";
import { useRealtimeUpdates } from "./participants/useRealtimeUpdates";
import { useParticipantsData } from "./participants/useParticipantsData";
import { useParticipantLoadingState } from "./participants/useParticipantLoadingState";
import { useParticipantRefresh } from "./participants/useParticipantRefresh";
import { useParticipantInitialLoad } from "./participants/useParticipantInitialLoad";

/**
 * Main hook for managing participants, their activities, and teams
 */
export const useParticipants = () => {
  const {
    participants,
    teams,
    participantActivities,
    isLoading,
    setIsLoading
  } = useParticipantData();
  
  // Load data hook
  const {
    loadData,
    isMountedRef,
    cleanupResources
  } = useParticipantsData();
  
  // Set up realtime updates
  const { isLoadingData } = useRealtimeUpdates(loadData);

  // Loading state management
  const {
    initialLoadAttempted,
    setInitialLoadAttempted,
    loadError,
    setLoadError,
    loadAttempts,
    setLoadAttempts
  } = useParticipantLoadingState();
  
  // Refresh management
  const { refreshing, setRefreshing, retryLoading } = useParticipantRefresh(loadData);
  
  // Initialize data loading
  useParticipantInitialLoad(
    loadData,
    setIsLoading,
    setLoadError,
    setInitialLoadAttempted,
    loadAttempts,
    setLoadAttempts,
    participants,
    teams
  );
  
  // Debug information
  useEffect(() => {
    console.log("Participants page state:", {
      isLoading,
      initialLoadAttempted,
      participantsCount: participants.length,
      teamsCount: teams.length,
      hasError: !!loadError,
      hasParticipantActivities: Object.keys(participantActivities).length > 0
    });
    
    if (loadError) {
      console.error("Load error details:", loadError);
    }
    
    if (participants.length > 0) {
      console.log("First participant:", participants[0]);
    }
  }, [isLoading, initialLoadAttempted, participants, teams, loadError, participantActivities]);
  
  // Force a refresh on initial render
  useEffect(() => {
    // Small delay to allow component to mount fully
    const timer = setTimeout(() => {
      const hasShownData = participants.length > 0;
      if (!hasShownData && !refreshing) {
        handleManualRefresh();
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Manual refresh handler
  const handleManualRefresh = async () => {
    try {
      setRefreshing(true);
      toast.info("Refreshing participant data...");
      
      // Use the retry loading function from the hook
      await retryLoading();
    } catch (error) {
      console.error("Manual refresh error:", error);
      toast.error("Failed to refresh data: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setRefreshing(false);
    }
  };
  
  // Team utilities
  const { getTeamById } = useTeamUtils(teams);

  return {
    participants,
    teams,
    participantActivities,
    isLoading: isLoading || isLoadingData,
    initialLoadAttempted,
    loadError,
    loadData,
    getTeamById,
    retryLoading,
    refreshing,
    handleManualRefresh
  };
};
