
import { Activity } from "@/types";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook for managing participant activities
 */
export const useParticipantActivities = () => {
  const loadActivitiesForParticipant = async (
    participantId: string, 
    participantName: string
  ): Promise<Activity[]> => {
    try {
      const { data: participantActivities, error } = await supabase
        .from('activities')
        .select('*')
        .eq('participant_id', participantId)
        .order('date', { ascending: false })
        .limit(20); // Limit to most recent 20 activities for performance
      
      if (error) {
        console.error(`Error loading activities for participant ${participantId}:`, error);
        return [];
      }
      
      return participantActivities.map(activity => ({
        id: activity.id,
        participantId: activity.participant_id,
        participantName: participantName,
        type: activity.description,
        minutes: activity.minutes,
        points: activity.points,
        date: activity.date.split('T')[0],
        notes: ""
      }));
    } catch (e) {
      console.error(`Error processing activities for participant ${participantId}:`, e);
      return [];
    }
  };

  return {
    loadActivitiesForParticipant
  };
};
