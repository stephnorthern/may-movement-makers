import { useEffect, useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { useParticipantData } from "./participants/useParticipantData";
import { useTeamUtils } from "./participants/useTeamUtils";
import { useRealtimeUpdates } from "./participants/useRealtimeUpdates";
import { useParticipantsData } from "./participants/useParticipantsData";
import { useParticipantLoadingState } from "./participants/useParticipantLoadingState";
import { useParticipantRefresh } from "./participants/useParticipantRefresh";
import { useParticipantInitialLoad } from "./participants/useParticipantInitialLoad";
import { useLoadingState } from "./participants/useLoadingState";
import { useDataLoadingLogic } from "./participants/useDataLoadingLogic";
import { useAuth } from "../contexts/AuthContext";
import { useParticipantActivities } from './participants/useParticipantActivities';
import { useParticipantQueries } from './queries/useParticipantQueries';
import { participantDataManager } from '@/lib/api/participants/dataManager';
import { Participant, Team } from '@/types';

/**
 * Main hook for managing participants, their activities, and teams
 */
export const useParticipants = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        setIsLoading(true);
        await participantDataManager.loadData();
        
        // Get data from local storage after it's been updated by the manager
        const participantsData = JSON.parse(localStorage.getItem('participants_cache') || '[]');
        const teamsData = JSON.parse(localStorage.getItem('teams_cache') || '[]');
        
        setParticipants(participantsData);
        setTeams(teamsData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial load
    loadData();

    // Setup realtime subscription
    const cleanup = participantDataManager.setupRealtimeSubscription(loadData);

    return () => {
      if (typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, [user]);

  const {
    loadParticipantsData,
    loadTeamMembersData,
    loadTeamsData,
    loadActivitiesData,
    participantActivities,
    setParticipantActivities,
    isLoading: participantDataIsLoading,
    setIsLoading: setParticipantDataIsLoading
  } = useParticipantData();

  const { loadActivitiesForParticipant } = useParticipantActivities();

  const {
    isMountedRef,
    loadFailedRef,
    initialLoadCompleteRef,
    isLoadingRef,
    startLoading,
    endLoading,
    cleanupResources
  } = useLoadingState(setParticipantDataIsLoading);

  const { loadData } = useDataLoadingLogic(
    loadParticipantsData,
    loadTeamMembersData,
    loadTeamsData,
    loadActivitiesData,
    setParticipants,
    setTeams,
    isMountedRef,
    loadFailedRef,
    initialLoadCompleteRef,
    startLoading,
    endLoading,
    loadActivitiesForParticipant,
    setParticipantActivities,
    isLoadingRef
  );

  // Single effect for data loading
  useEffect(() => {
    let mounted = true;

    const initializeData = async () => {
      if (!user || isLoadingRef.current) return;

      try {
        // Initial data load
        await loadData(true);
      } catch (error) {
        console.error("Error in initial data load:", error);
      }
    };

    initializeData();

    return () => {
      mounted = false;
      cleanupResources();
    };
  }, [user]); // Only depend on user

  // Load data hook setup
  const {
    loadData: loadDataHook,
    isMountedRef: loadDataIsMountedRef,
    cleanupResources: loadDataCleanupResources
  } = useParticipantsData();
  
  // Set up realtime updates
  const { isLoadingData } = useRealtimeUpdates(loadDataHook);

  // Loading state management
  const {
    initialLoadAttempted,
    setInitialLoadAttempted,
    loadError,
    setLoadError,
    loadAttempts,
    setLoadAttempts
  } = useParticipantLoadingState();
  
  // Refresh management with enhanced error handling
  const { refreshing, setRefreshing, retryLoading } = useParticipantRefresh(loadDataHook);
  
  // Initialize data loading with fallback strategies
  useParticipantInitialLoad(
    loadDataHook,
    setParticipantDataIsLoading,
    setLoadError,
    setInitialLoadAttempted,
    loadAttempts,
    setLoadAttempts,
    participants,
    teams
  );
  
  // Debug information effect
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log("Participants page state:", {
        isLoading,
        initialLoadAttempted,
        participantsCount: participants.length,
        teamsCount: teams.length,
        hasError: !!loadError,
        hasParticipantActivities: Object.keys(participantActivities).length > 0,
        refreshing
      });
    }
  }, [isLoading, initialLoadAttempted, participants, teams, loadError, participantActivities, refreshing]);
  
  // Manual refresh handler
  const handleManualRefresh = async () => {
    if (refreshing) {
      console.log("Refresh already in progress, skipping");
      return;
    }
    
    try {
      setRefreshing(true);
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

  const { 
    teamMembers,
    activities,
    isError,
    error
  } = useParticipantQueries();

  // Compute derived data
  const participantsWithData = useMemo(() => {
    if (!participants || !activities || !teamMembers) return [];

    return participants.map(participant => {
      const participantActivities = activities.filter(
        activity => activity.participant_id === participant.id
      );
      
      const points = participantActivities.reduce(
        (sum, activity) => sum + activity.points,
        0
      );
      
      const teamMember = teamMembers.find(
        tm => tm.participant_id === participant.id
      );
      
      return {
        ...participant,
        points,
        teamId: teamMember?.team_id
      };
    }).sort((a, b) => b.points - a.points);
  }, [participants, activities, teamMembers]);

  const getTeamByIdDerived = useCallback((teamId: string) => {
    return teams.find(team => team.id === teamId);
  }, [teams]);

  return {
    participants: participantsWithData,
    teams,
    isLoading: isLoading || isLoadingData,
    initialLoadAttempted,
    loadError,
    loadData,
    getTeamById: getTeamByIdDerived,
    retryLoading,
    refreshing,
    handleManualRefresh,
    isError,
    error
  };
};
