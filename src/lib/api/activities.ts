
import { Activity, Participant } from "@/types";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { calculatePoints } from "../utils/calculations";
import { getParticipants } from "./participants";
import { updateParticipantStats, updateParticipantStatsInSupabase } from "./participants";

const ACTIVITIES_KEY = "may-movement-activities";

// Activity Methods
export const getActivities = async (): Promise<Activity[]> => {
  try {
    // First, try to get from Supabase
    const { data: supabaseActivities, error } = await supabase
      .from('activities')
      .select(`
        id,
        participant_id,
        description,
        minutes,
        date,
        points
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching from Supabase:", error);
      // Fall back to local storage
      const localData = localStorage.getItem(ACTIVITIES_KEY);
      return localData ? JSON.parse(localData) : [];
    }

    if (!supabaseActivities) {
      return [];
    }

    // Get participants to map names
    const participants = getParticipants();

    // Map Supabase data to our Activity type
    return supabaseActivities.map(a => {
      const participant = participants.find(p => p.id === a.participant_id) || { name: "Unknown" };
      
      return {
        id: a.id,
        participantId: a.participant_id,
        participantName: participant.name,
        type: a.description, // Map description to type
        minutes: a.minutes,
        points: a.points || calculatePoints(a.minutes),
        date: a.date.split('T')[0], // Format date
        notes: ""  // No notes field in our DB yet
      };
    });
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
        participant_id,
        description,
        minutes,
        date,
        points
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

    if (!supabaseActivities) {
      return [];
    }

    // Get participants to map names
    const participants = getParticipants();
    const participant = participants.find(p => p.id === participantId) || { name: "Unknown" };

    // Map Supabase data to our Activity type
    return supabaseActivities.map(a => {
      return {
        id: a.id,
        participantId: a.participant_id,
        participantName: participant.name,
        type: a.description, // Map description to type
        minutes: a.minutes,
        points: a.points || calculatePoints(a.minutes),
        date: a.date.split('T')[0], // Format date
        notes: ""  // No notes field in our DB yet
      };
    });
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
        description: activity.type, // Map type to description
        minutes: activity.minutes,
        date: activity.date,
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
    
    // Update participant stats (with negative minutes to subtract)
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
      localStorage.setItem("may-movement-participants", JSON.stringify(participants));
    }
    
    // Remove the activity
    const updatedActivities = parsedActivities.filter(a => a.id !== activityId);
    localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(updatedActivities));
    
    toast.success("Activity deleted! (local storage mode)");
    
    // Trigger an event to refresh the UI
    window.dispatchEvent(new Event("storage"));
  }
};
