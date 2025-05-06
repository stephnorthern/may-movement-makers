
import { Participant, Activity, Team } from "@/types";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const PARTICIPANTS_KEY = "may-movement-participants";
const ACTIVITIES_KEY = "may-movement-activities";
const TEAMS_KEY = "may-movement-teams";

// Helper to calculate points from minutes
export const calculatePoints = (minutes: number): number => {
  return Math.floor(minutes / 15);
};

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

// Team Methods
export const getTeams = (): Team[] => {
  const data = localStorage.getItem(TEAMS_KEY);
  return data ? JSON.parse(data) : [];
};

export const getTeam = (id: string): Team | undefined => {
  const teams = getTeams();
  return teams.find(t => t.id === id);
};

export const addTeam = (team: Omit<Team, "id">): void => {
  const teams = getTeams();
  const newTeam: Team = {
    ...team,
    id: Date.now().toString()
  };
  
  localStorage.setItem(TEAMS_KEY, JSON.stringify([...teams, newTeam]));
  toast.success(`Team ${team.name} added!`);
};

export const updateTeam = (id: string, updates: Partial<Omit<Team, "id">>): void => {
  const teams = getTeams();
  const teamIndex = teams.findIndex(t => t.id === id);
  
  if (teamIndex === -1) return;
  
  teams[teamIndex] = { ...teams[teamIndex], ...updates };
  localStorage.setItem(TEAMS_KEY, JSON.stringify(teams));
  toast.success(`Team updated!`);
};

export const deleteTeam = (id: string): void => {
  // First, remove team from all participants
  const participants = getParticipants();
  const updatedParticipants = participants.map(p => {
    if (p.teamId === id) {
      const { teamId, ...rest } = p;
      return rest;
    }
    return p;
  });
  localStorage.setItem(PARTICIPANTS_KEY, JSON.stringify(updatedParticipants));
  
  // Then delete the team
  const teams = getTeams();
  const filteredTeams = teams.filter(t => t.id !== id);
  localStorage.setItem(TEAMS_KEY, JSON.stringify(filteredTeams));
  
  toast.success(`Team deleted!`);
};

// Activity Methods
export const getActivities = async (): Promise<Activity[]> => {
  try {
    // First, try to get from Supabase
    const { data: supabaseActivities, error } = await supabase
      .from('activities')
      .select(`
        id,
        type,
        minutes,
        date,
        notes,
        points,
        participant_id,
        participants (name)
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching from Supabase:", error);
      // Fall back to local storage
      const localData = localStorage.getItem(ACTIVITIES_KEY);
      return localData ? JSON.parse(localData) : [];
    }

    // Map Supabase data to our Activity type
    return supabaseActivities.map(a => ({
      id: a.id,
      participantId: a.participant_id,
      participantName: a.participants?.name || "Unknown",
      type: a.type,
      minutes: a.minutes,
      points: a.points,
      date: a.date,
      notes: a.notes || undefined
    }));
  } catch (e) {
    console.error("Error in getActivities:", e);
    // Fall back to local storage
    const localData = localStorage.getItem(ACTIVITIES_KEY);
    return localData ? JSON.parse(localData) : [];
  }
};

export const getParticipantActivities = async (participantId: string): Promise<Activity[]> => {
  try {
    // Try to get from Supabase
    const { data: supabaseActivities, error } = await supabase
      .from('activities')
      .select(`
        id,
        type,
        minutes,
        date,
        notes,
        points,
        participant_id,
        participants (name)
      `)
      .eq('participant_id', participantId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching from Supabase:", error);
      // Fall back to local storage
      const activities = localStorage.getItem(ACTIVITIES_KEY);
      const parsedActivities = activities ? JSON.parse(activities) : [];
      return parsedActivities.filter(activity => activity.participantId === participantId);
    }

    // Map Supabase data to our Activity type
    return supabaseActivities.map(a => ({
      id: a.id,
      participantId: a.participant_id,
      participantName: a.participants?.name || "Unknown",
      type: a.type,
      minutes: a.minutes,
      points: a.points,
      date: a.date,
      notes: a.notes || undefined
    }));
  } catch (e) {
    console.error("Error in getParticipantActivities:", e);
    // Fall back to local storage
    const activities = localStorage.getItem(ACTIVITIES_KEY);
    const parsedActivities = activities ? JSON.parse(activities) : [];
    return parsedActivities.filter(activity => activity.participantId === participantId);
  }
};

export const addActivity = async (activity: Omit<Activity, "id" | "points">): Promise<void> => {
  const points = calculatePoints(activity.minutes);
  
  try {
    // Try to add to Supabase first
    const { error } = await supabase
      .from('activities')
      .insert({
        participant_id: activity.participantId,
        type: activity.type,
        minutes: activity.minutes,
        date: activity.date,
        notes: activity.notes || null,
        points: points
      });
    
    if (error) {
      console.error("Error adding to Supabase:", error);
      throw error;
    }

    // Update participant's total stats
    await updateParticipantStatsInSupabase(activity.participantId, activity.minutes);
    
    toast.success(`Activity added: ${points} points earned!`);
    
    // Trigger an event to refresh the UI
    window.dispatchEvent(new Event("storage"));
    
  } catch (e) {
    console.error("Error in addActivity:", e);
    
    // Fall back to local storage
    const activities = localStorage.getItem(ACTIVITIES_KEY);
    const parsedActivities = activities ? JSON.parse(activities) : [];
    
    const newActivity: Activity = {
      ...activity,
      id: Date.now().toString(),
      points
    };
    
    localStorage.setItem(ACTIVITIES_KEY, JSON.stringify([...parsedActivities, newActivity]));
    
    // Update participant's total stats
    updateParticipantStats(activity.participantId, activity.minutes);
    
    toast.success(`Activity added: ${points} points earned! (local storage mode)`);
    
    // Dispatch an event to notify other components
    window.dispatchEvent(new Event("storage"));
  }
};

export const deleteActivity = async (activityId: string): Promise<void> => {
  try {
    // Get the activity first to know how many points to subtract
    const { data: activityToDelete, error: fetchError } = await supabase
      .from('activities')
      .select('*')
      .eq('id', activityId)
      .single();
    
    if (fetchError || !activityToDelete) {
      console.error("Error fetching activity:", fetchError);
      throw fetchError;
    }
    
    // Delete the activity
    const { error: deleteError } = await supabase
      .from('activities')
      .delete()
      .eq('id', activityId);
    
    if (deleteError) {
      console.error("Error deleting activity:", deleteError);
      throw deleteError;
    }
    
    // Update participant stats
    await updateParticipantStatsInSupabase(
      activityToDelete.participant_id, 
      -activityToDelete.minutes
    );
    
    toast.success("Activity deleted!");
    
    // Trigger an event to refresh the UI
    window.dispatchEvent(new Event("storage"));
    
  } catch (e) {
    console.error("Error in deleteActivity:", e);
    
    // Fall back to local storage
    const activities = localStorage.getItem(ACTIVITIES_KEY);
    const parsedActivities = activities ? JSON.parse(activities) : [];
    const activityToDelete = parsedActivities.find(a => a.id === activityId);
    
    if (!activityToDelete) return;
    
    // Update participant stats (subtract the activity)
    const participants = getParticipants();
    const participant = participants.find(p => p.id === activityToDelete.participantId);
    
    if (participant) {
      participant.totalMinutes -= activityToDelete.minutes;
      participant.points -= activityToDelete.points;
      localStorage.setItem(PARTICIPANTS_KEY, JSON.stringify(participants));
    }
    
    // Remove the activity
    const updatedActivities = parsedActivities.filter(a => a.id !== activityId);
    localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(updatedActivities));
    
    toast.success("Activity deleted! (local storage mode)");
    
    // Trigger an event to refresh the UI
    window.dispatchEvent(new Event("storage"));
  }
};

// New helper function to update participant stats in Supabase
const updateParticipantStatsInSupabase = async (participantId: string, additionalMinutes: number): Promise<void> => {
  try {
    // First get the current participant's stats
    const { data: participant, error: fetchError } = await supabase
      .from('participants')
      .select('total_minutes, points')
      .eq('id', participantId)
      .single();
    
    if (fetchError) {
      console.error("Error fetching participant:", fetchError);
      throw fetchError;
    }
    
    const additionalPoints = calculatePoints(additionalMinutes);
    const newTotalMinutes = (participant.total_minutes || 0) + additionalMinutes;
    const newPoints = (participant.points || 0) + additionalPoints;
    
    // Update the participant's stats
    const { error: updateError } = await supabase
      .from('participants')
      .update({
        total_minutes: Math.max(0, newTotalMinutes), // Prevent negative values
        points: Math.max(0, newPoints) // Prevent negative values
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
