import { useEffect, useState, useMemo, useCallback, useRef } from "react";
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
import { Participant, Team, Activity } from '@/types';
import { useDataLoading } from "@/contexts/DataLoadingContext";
import { useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Main hook for managing participants, their activities, and teams
 */
export const useParticipants = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);

  // Query participants with their team associations
  const { data: participants = [], isLoading: isParticipantsLoading, error: participantsError } = useQuery({
    queryKey: ['participants'],
    queryFn: async () => {
      try {
        const { data: participantsData, error: participantsError } = await supabase
          .from('participants')
          .select(`
            *,
            team_members (
              team_id
            )
          `);
        
        if (participantsError) throw participantsError;
        return participantsData || [];
      } catch (error) {
        setLoadError(error as Error);
        throw error;
      }
    },
    staleTime: 30000,
    enabled: !!user
  });

  // Query activities
  const { data: activities = [], isLoading: isActivitiesLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activities')
        .select(`
          id,
          participant_id,
          description,
          minutes,
          date,
          points,
          participants (
            id,
            name
          )
        `);
      if (error) throw error;
      return data || [];
    },
    staleTime: 30000,
    enabled: !!user
  });

  // Query teams
  const { data: teams = [], isLoading: isTeamsLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const { data, error } = await supabase.from('teams').select('*');
      if (error) throw error;
      return data || [];
    },
    staleTime: 30000,
    enabled: !!user
  });

  // Process participants with their activities and team info
  const processedParticipants = useMemo(() => {
    return participants.map(participant => {
      const participantActivities = activities.filter(
        activity => activity.participant_id === participant.id
      );
      
      const totalMinutes = participantActivities.reduce(
        (sum, activity) => sum + (activity.minutes || 0),
        0
      );
      
      const points = participantActivities.reduce(
        (sum, activity) => sum + (activity.points || 0),
        0
      );
      
      return {
        ...participant,
        points,
        totalMinutes,
        teamId: participant.team_members?.[0]?.team_id
      };
    });
  }, [participants, activities]);

  // Create a map of participant activities
  const participantActivities = useMemo(() => {
    const activityMap: Record<string, Activity[]> = {};
    
    activities.forEach(activity => {
      if (!activity.participant_id) return;
      
      if (!activityMap[activity.participant_id]) {
        activityMap[activity.participant_id] = [];
      }

      activityMap[activity.participant_id].push({
        id: activity.id,
        participantId: activity.participant_id,
        participantName: activity.participants?.name || "Unknown",
        type: activity.description || "",
        minutes: activity.minutes || 0,
        points: activity.points || 0,
        date: activity.date ? activity.date.toString().split('T')[0] : "",
        notes: ""
      });
    });

    return activityMap;
  }, [activities]);

  // Team utility function
  const getTeamById = useCallback((teamId?: string) => {
    if (!teamId) return null;
    return teams.find(team => team.id === teamId) || null;
  }, [teams]);

  const isLoading = isParticipantsLoading || isTeamsLoading || isActivitiesLoading;

  useEffect(() => {
    // Update loadError if any query has an error
    if (participantsError) {
      setLoadError(participantsError as Error);
    } else {
      setLoadError(null);
    }
  }, [participantsError]);

  const refreshData = useCallback(async () => {
    setRefreshing(true);
    setLoadError(null); // Reset error state when refreshing
    try {
      await queryClient.invalidateQueries({ queryKey: ['participants'] });
      await queryClient.invalidateQueries({ queryKey: ['teams'] });
      await queryClient.invalidateQueries({ queryKey: ['activities'] });
    } catch (error) {
      setLoadError(error as Error);
    } finally {
      setRefreshing(false);
    }
  }, [queryClient]);

  return {
    participants: processedParticipants,
    teams,
    isLoading,
    refreshData,
    getTeamById,
    participantActivities,
    error: null,
    isError: false,
    initialLoadAttempted: true,
    handleManualRefresh: refreshData,
    refreshing,
    loadError,
  };
};
