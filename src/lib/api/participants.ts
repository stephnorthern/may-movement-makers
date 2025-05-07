
import { Participant } from "@/types";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Participant Methods
export const getParticipants = async (): Promise<Participant[]> => {
  try {
    const { data: participants, error } = await supabase
      .from('participants')
      .select('*');
    
    if (error) {
      console.error("Error fetching participants:", error);
      throw error;
    }
    
    // Map Supabase data to our Participant type
    return participants.map(p => ({
      id: p.id,
      name: p.name,
      points: 0, // We'll calculate this from activities
      totalMinutes: p.total_minutes || 0,
      teamId: undefined // We'll need to get this from team_members table
    }));
  } catch (e) {
    console.error("Error in getParticipants:", e);
    // Fall back to local storage
    const data = localStorage.getItem("may-movement-participants");
    return data ? JSON.parse(data) : [];
  }
};

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
    
    return {
      id: participant.id,
      name: participant.name,
      points: 0, // Calculate from activities
      totalMinutes: participant.total_minutes || 0,
      teamId: undefined // Get from team_members
    };
  } catch (e) {
    console.error("Error in getParticipant:", e);
    // Fall back to local storage
    const participants = localStorage.getItem("may-movement-participants");
    const parsedParticipants = participants ? JSON.parse(participants) : [];
    return parsedParticipants.find(p => p.id === id);
  }
};

export const addParticipant = async (participant: Omit<Participant, "id" | "points" | "totalMinutes">): Promise<void> => {
  try {
    // Generate UUID
    const id = crypto.randomUUID();
    
    const { error } = await supabase
      .from('participants')
      .insert({
        id: id,
        name: participant.name,
        total_minutes: 0
      });
    
    if (error) {
      console.error("Error adding participant:", error);
      throw error;
    }
    
    // If team is provided, add to team_members
    if (participant.teamId) {
      const { error: teamError } = await supabase
        .from('team_members')
        .insert({
          participant_id: id,
          team_id: participant.teamId
        });
      
      if (teamError) {
        console.error("Error adding participant to team:", teamError);
      }
    }
    
    toast.success(`${participant.name} added to challenge!`);
    // Trigger event to refresh UI
    window.dispatchEvent(new Event("storage"));
    
  } catch (e) {
    console.error("Error in addParticipant:", e);
    // Fall back to local storage
    const participants = localStorage.getItem("may-movement-participants");
    const parsedParticipants = participants ? JSON.parse(participants) : [];
    
    const newParticipant: Participant = {
      ...participant,
      id: Date.now().toString(), // Simple ID generation
      points: 0,
      totalMinutes: 0
    };
    
    localStorage.setItem("may-movement-participants", JSON.stringify([...parsedParticipants, newParticipant]));
    toast.success(`${participant.name} added to challenge! (local storage mode)`);
    // Dispatch an event to notify other components
    window.dispatchEvent(new Event("storage"));
  }
};

export const updateParticipantStats = async (participantId: string, additionalMinutes: number): Promise<void> => {
  try {
    // First get the current participant's stats
    const { data: participant, error: fetchError } = await supabase
      .from('participants')
      .select('total_minutes')
      .eq('id', participantId)
      .single();
    
    if (fetchError) {
      console.error("Error fetching participant:", fetchError);
      throw fetchError;
    }
    
    // Calculate new total minutes
    const newTotalMinutes = (participant?.total_minutes || 0) + additionalMinutes;
    
    // Update the participant's stats
    const { error: updateError } = await supabase
      .from('participants')
      .update({
        total_minutes: Math.max(0, newTotalMinutes) // Prevent negative values
      })
      .eq('id', participantId);
    
    if (updateError) {
      console.error("Error updating participant stats:", updateError);
      throw updateError;
    }
    
    // Trigger event to refresh UI
    window.dispatchEvent(new Event("storage"));
    
  } catch (e) {
    console.error("Error in updateParticipantStats:", e);
    
    // Fall back to local storage
    const participants = localStorage.getItem("may-movement-participants");
    const parsedParticipants = participants ? JSON.parse(participants) : [];
    const participantIndex = parsedParticipants.findIndex(p => p.id === participantId);
    
    if (participantIndex === -1) return;
    
    const additionalPoints = calculatePoints(additionalMinutes);
    const participant = parsedParticipants[participantIndex];
    
    participant.totalMinutes += additionalMinutes;
    participant.points += additionalPoints;
    
    parsedParticipants[participantIndex] = participant;
    localStorage.setItem("may-movement-participants", JSON.stringify(parsedParticipants));
  }
};

export const assignParticipantToTeam = async (participantId: string, teamId: string | null): Promise<void> => {
  try {
    if (teamId) {
      // Check if association already exists
      const { data: existingRecord, error: checkError } = await supabase
        .from('team_members')
        .select('*')
        .eq('participant_id', participantId);
      
      if (checkError) {
        console.error("Error checking team member:", checkError);
        throw checkError;
      }
      
      if (existingRecord && existingRecord.length > 0) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('team_members')
          .update({
            team_id: teamId
          })
          .eq('participant_id', participantId);
        
        if (updateError) {
          console.error("Error updating team member:", updateError);
          throw updateError;
        }
      } else {
        // Create new record
        const { error: insertError } = await supabase
          .from('team_members')
          .insert({
            participant_id: participantId,
            team_id: teamId
          });
        
        if (insertError) {
          console.error("Error inserting team member:", insertError);
          throw insertError;
        }
      }
      
      toast.success(`Participant added to team!`);
    } else {
      // Remove from team
      const { error: deleteError } = await supabase
        .from('team_members')
        .delete()
        .eq('participant_id', participantId);
      
      if (deleteError) {
        console.error("Error removing team member:", deleteError);
        throw deleteError;
      }
      
      toast.success(`Participant removed from team!`);
    }
    
    // Trigger event to refresh UI
    window.dispatchEvent(new Event("storage"));
    
  } catch (e) {
    console.error("Error in assignParticipantToTeam:", e);
    
    // Fall back to local storage
    const participants = localStorage.getItem("may-movement-participants");
    const parsedParticipants = participants ? JSON.parse(participants) : [];
    const participantIndex = parsedParticipants.findIndex(p => p.id === participantId);
    
    if (participantIndex === -1) return;
    
    const participant = parsedParticipants[participantIndex];
    
    if (teamId) {
      participant.teamId = teamId;
      toast.success(`Participant added to team! (local storage mode)`);
    } else {
      delete participant.teamId;
      toast.success(`Participant removed from team! (local storage mode)`);
    }
    
    parsedParticipants[participantIndex] = participant;
    localStorage.setItem("may-movement-participants", JSON.stringify(parsedParticipants));
    
    // Dispatch an event to notify other components
    window.dispatchEvent(new Event("storage"));
  }
};

// Helper to calculate points from minutes
export const calculatePoints = (minutes: number): number => {
  return Math.floor(minutes / 15);
};

// Pass-through to original function for backward compatibility
export const updateParticipantStatsInSupabase = updateParticipantStats;
