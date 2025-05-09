
import { Participant } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { PARTICIPANTS_KEY } from "./constants";

/**
 * Fetches all participants with their team associations and calculated points
 */
export const getParticipants = async (): Promise<Participant[]> => {
  try {
    // Try to get from Supabase
    const { data: supabaseParticipants, error } = await supabase
      .from('participants')
      .select('*');
    
    if (error) {
      console.error("Error fetching participants from Supabase:", error);
      throw error;
    }
    
    // Get team members to map team associations
    const { data: teamMembers, error: teamMembersError } = await supabase
      .from('team_members')
      .select('*');
    
    if (teamMembersError) {
      console.error("Error fetching team members:", teamMembersError);
    }
    
    // Get activities to calculate points
    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select('*');
    
    if (activitiesError) {
      console.error("Error fetching activities:", activitiesError);
    }
    
    return supabaseParticipants.map(p => {
      // Calculate points from activities
      const participantActivities = activities?.filter(
        a => a.participant_id === p.id
      ) || [];
      const points = participantActivities.reduce(
        (sum, activity) => sum + activity.points, 0
      );
      
      // Find team association
      const teamMember = teamMembers?.find(tm => tm.participant_id === p.id);
      
      return {
        id: p.id,
        name: p.name,
        points: points,
        totalMinutes: p.total_minutes || 0,
        teamId: teamMember?.team_id
      };
    });
    
  } catch (e) {
    console.error("Error in getParticipants:", e);
    // Fall back to local storage
    const localData = localStorage.getItem(PARTICIPANTS_KEY);
    return localData ? JSON.parse(localData) : [];
  }
};

/**
 * Fetches a single participant by ID with team association and calculated points
 */
export const getParticipant = async (id: string): Promise<Participant | undefined> => {
  try {
    const { data: participant, error } = await supabase
      .from('participants')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error("Error fetching participant:", error);
      throw error;
    }
    
    if (!participant) return undefined;
    
    // Get team association
    const { data: teamMember, error: teamMemberError } = await supabase
      .from('team_members')
      .select('*')
      .eq('participant_id', id)
      .maybeSingle();
    
    if (teamMemberError) {
      console.error("Error fetching team member:", teamMemberError);
    }
    
    // Get activities to calculate points
    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select('*')
      .eq('participant_id', id);
    
    if (activitiesError) {
      console.error("Error fetching activities:", activitiesError);
    }
    
    const points = activities?.reduce((sum, activity) => sum + activity.points, 0) || 0;
    
    return {
      id: participant.id,
      name: participant.name,
      points: points,
      totalMinutes: participant.total_minutes || 0,
      teamId: teamMember?.team_id
    };
    
  } catch (e) {
    console.error("Error in getParticipant:", e);
    // Fall back to local storage
    const participants = localStorage.getItem(PARTICIPANTS_KEY);
    const parsedParticipants = participants ? JSON.parse(participants) : [];
    return parsedParticipants.find(p => p.id === id);
  }
};
