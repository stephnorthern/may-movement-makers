
import { Participant } from "@/types";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const PARTICIPANTS_KEY = "may-movement-participants";

// Participant Methods
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

export const addParticipant = async (participant: { name: string, teamId?: string }): Promise<void> => {
  try {
    // Generate UUID
    const id = crypto.randomUUID();
    
    // Try to add to Supabase first
    const { error } = await supabase
      .from('participants')
      .insert({
        id: id,
        name: participant.name,
        total_minutes: 0
      });
    
    if (error) {
      console.error("Error adding participant to Supabase:", error);
      throw error;
    }
    
    // If team is provided, create team member association
    if (participant.teamId) {
      const { error: teamMemberError } = await supabase
        .from('team_members')
        .insert({
          participant_id: id,
          team_id: participant.teamId
        });
      
      if (teamMemberError) {
        console.error("Error associating participant with team:", teamMemberError);
      }
    }
    
    toast.success(`${participant.name} added to participants!`);
    window.dispatchEvent(new Event("storage"));
    
  } catch (e) {
    console.error("Error in addParticipant:", e);
    // Fall back to local storage
    const participants = localStorage.getItem(PARTICIPANTS_KEY);
    const parsedParticipants = participants ? JSON.parse(participants) : [];
    
    const newParticipant: Participant = {
      id: Date.now().toString(),
      name: participant.name,
      points: 0,
      totalMinutes: 0,
      teamId: participant.teamId
    };
    
    localStorage.setItem(PARTICIPANTS_KEY, JSON.stringify([...parsedParticipants, newParticipant]));
    toast.success(`${participant.name} added to participants! (local storage mode)`);
    window.dispatchEvent(new Event("storage"));
  }
};

export const updateParticipantStats = (participantId: string, minutes: number): void => {
  const participants = localStorage.getItem(PARTICIPANTS_KEY);
  const parsedParticipants = participants ? JSON.parse(participants) : [];
  
  const participant = parsedParticipants.find(p => p.id === participantId);
  if (participant) {
    participant.totalMinutes += minutes;
    localStorage.setItem(PARTICIPANTS_KEY, JSON.stringify(parsedParticipants));
  }
};

export const updateParticipantStatsInSupabase = async (participantId: string, minutes: number): Promise<void> => {
  try {
    // First, get the current total_minutes
    const { data: participant, error: fetchError } = await supabase
      .from('participants')
      .select('total_minutes')
      .eq('id', participantId)
      .single();
    
    if (fetchError) {
      console.error("Error fetching participant:", fetchError);
      throw fetchError;
    }
    
    // Calculate new total
    const newTotal = (participant.total_minutes || 0) + minutes;
    
    // Update the participant
    const { error: updateError } = await supabase
      .from('participants')
      .update({ total_minutes: newTotal })
      .eq('id', participantId);
    
    if (updateError) {
      console.error("Error updating participant stats:", updateError);
      throw updateError;
    }
  } catch (e) {
    console.error("Error in updateParticipantStatsInSupabase:", e);
    // Fall back to local storage
    updateParticipantStats(participantId, minutes);
  }
};

export const updateParticipantTeam = async (participantId: string, teamId: string | null): Promise<void> => {
  try {
    // First, remove any existing team association
    const { error: deleteError } = await supabase
      .from('team_members')
      .delete()
      .eq('participant_id', participantId);
    
    if (deleteError) {
      console.error("Error removing previous team association:", deleteError);
      throw deleteError;
    }
    
    // If a team is specified (not "none" or null), add new association
    if (teamId && teamId !== "none") {
      const { error: insertError } = await supabase
        .from('team_members')
        .insert({
          participant_id: participantId,
          team_id: teamId
        });
      
      if (insertError) {
        console.error("Error adding team association:", insertError);
        throw insertError;
      }
    }
    
    toast.success("Team updated successfully!");
    window.dispatchEvent(new Event("storage"));
    
  } catch (e) {
    console.error("Error in updateParticipantTeam:", e);
    // Fall back to local storage
    const participants = localStorage.getItem(PARTICIPANTS_KEY);
    const parsedParticipants = participants ? JSON.parse(participants) : [];
    
    const participant = parsedParticipants.find(p => p.id === participantId);
    if (participant) {
      if (teamId && teamId !== "none") {
        participant.teamId = teamId;
      } else {
        delete participant.teamId;
      }
      
      localStorage.setItem(PARTICIPANTS_KEY, JSON.stringify(parsedParticipants));
      toast.success("Team updated successfully! (local storage mode)");
      window.dispatchEvent(new Event("storage"));
    }
  }
};
