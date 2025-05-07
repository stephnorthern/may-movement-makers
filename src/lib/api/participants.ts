
import { Participant } from "@/types";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const PARTICIPANTS_KEY = "may-movement-participants";

// Participant Methods
export const getParticipants = (): Participant[] => {
  const data = localStorage.getItem(PARTICIPANTS_KEY);
  return data ? JSON.parse(data) : [];
};

export const getParticipant = (id: string): Participant | undefined => {
  const participants = getParticipants();
  return participants.find(p => p.id === id);
};

export const addParticipant = (participant: Omit<Participant, "id" | "points" | "totalMinutes">): void => {
  const participants = getParticipants();
  const newParticipant: Participant = {
    ...participant,
    id: Date.now().toString(), // Simple ID generation
    points: 0,
    totalMinutes: 0
  };
  
  localStorage.setItem(PARTICIPANTS_KEY, JSON.stringify([...participants, newParticipant]));
  toast.success(`${participant.name} added to challenge!`);
};

export const updateParticipantStats = (participantId: string, additionalMinutes: number): void => {
  const participants = getParticipants();
  const participantIndex = participants.findIndex(p => p.id === participantId);
  
  if (participantIndex === -1) return;
  
  const additionalPoints = calculatePoints(additionalMinutes);
  const participant = participants[participantIndex];
  
  participant.totalMinutes += additionalMinutes;
  participant.points += additionalPoints;
  
  participants[participantIndex] = participant;
  localStorage.setItem(PARTICIPANTS_KEY, JSON.stringify(participants));
};

export const assignParticipantToTeam = (participantId: string, teamId: string | null): void => {
  const participants = getParticipants();
  const participantIndex = participants.findIndex(p => p.id === participantId);
  
  if (participantIndex === -1) return;
  
  const participant = participants[participantIndex];
  
  if (teamId) {
    participant.teamId = teamId;
    toast.success(`${participant.name} added to team!`);
  } else {
    delete participant.teamId;
    toast.success(`${participant.name} removed from team!`);
  }
  
  participants[participantIndex] = participant;
  localStorage.setItem(PARTICIPANTS_KEY, JSON.stringify(participants));
};

// Helper to calculate points from minutes
export const calculatePoints = (minutes: number): number => {
  return Math.floor(minutes / 15);
};

// New helper function to update participant stats in Supabase
export const updateParticipantStatsInSupabase = async (participantId: string, additionalMinutes: number): Promise<void> => {
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
    
    // Calculate new values
    const additionalPoints = calculatePoints(additionalMinutes);
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
  } catch (e) {
    console.error("Error in updateParticipantStatsInSupabase:", e);
    
    // Fall back to local storage method
    updateParticipantStats(participantId, additionalMinutes);
  }
};
