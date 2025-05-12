
import { Participant } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { PARTICIPANTS_KEY } from "./constants";

/**
 * Fetches all participants with their team associations and calculated points
 */
export const getParticipants = async (): Promise<Participant[]> => {
  try {
    console.log("Fetching participants data from Supabase");
    
    // Try to get from Supabase with timeout control
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
    
    const { data: supabaseParticipants, error } = await supabase
      .from('participants')
      .select('*');
    
    clearTimeout(timeoutId);
    
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
    
    // Provide more specific error message for network issues
    if (e instanceof Error && 
        (e.message.includes("fetch") || 
         e.message.includes("network") || 
         e.message.includes("timeout") || 
         !navigator.onLine)) {
      console.log("Network connectivity issue detected in getParticipants");
      throw new Error("Network connectivity issue. Please check your internet connection and try again.");
    }
    
    // Fall back to local storage
    console.log("Falling back to local storage for participants data");
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
