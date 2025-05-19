
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PARTICIPANTS_KEY } from "./constants";

/**
 * Adds a new participant and optionally assigns them to a team
 */
export const addParticipant = async (id: string, participant: { name: string, teamId?: string }): Promise<void> => {
  try {
    // Generate UUID
    // const id = crypto.randomUUID();
    
    // Try to add to Supabase first
    const { error } = await supabase
      .from('participants')
      .insert({
        id: id,
        name: participant.name,
        total_minutes: 0,
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
    
    const newParticipant = {
      id: Date.now().toString(),
      name: participant.name,
      points: 0,
      totalMinutes: 0,
      teamId: participant.teamId,
    };
    
    localStorage.setItem(PARTICIPANTS_KEY, JSON.stringify([...parsedParticipants, newParticipant]));
    toast.success(`${participant.name} added to participants! (local storage mode)`);
    window.dispatchEvent(new Event("storage"));
  }
};

/**
 * Updates participant statistics (local storage fallback method)
 */
export const updateParticipantStats = (participantId: string, minutes: number): void => {
  const participants = localStorage.getItem(PARTICIPANTS_KEY);
  const parsedParticipants = participants ? JSON.parse(participants) : [];
  
  const participant = parsedParticipants.find(p => p.id === participantId);
  if (participant) {
    participant.totalMinutes += minutes;
    localStorage.setItem(PARTICIPANTS_KEY, JSON.stringify(parsedParticipants));
  }
};

/**
 * Updates participant statistics in Supabase
 */
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
      .update({
        total_minutes: newTotal,
      })
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

/**
 * Assigns a participant to a team or removes them from their current team
 */
export const assignParticipantToTeam = async (participantId: string, teamId: string | null): Promise<void> => {
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
    console.error("Error in assignParticipantToTeam:", e);
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
