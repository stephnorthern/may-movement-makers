
import { Activity } from "@/types";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { calculatePoints } from "../../utils/calculations";
import { updateParticipantStatsInSupabase } from "../participants";

const ACTIVITIES_KEY = "may-movement-activities";

/**
 * Adds a new activity, calculating points and updating participant stats
 */
export const addActivity = async (activity: Omit<Activity, "id" | "points">): Promise<void> => {
  const points = calculatePoints(activity.minutes);
  
  try {
    // Generate a unique ID
    const id = crypto.randomUUID();
    
    // Try to add to Supabase first
    const { error } = await supabase
      .from('activities')
      .insert({
        id: id,
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
    
    // Update participant's total stats in local storage
    updateLocalParticipantStats(activity.participantId, activity.minutes);
    
    toast.success(`Activity added: ${points} points earned! (local storage mode)`);
    
    // Dispatch an event to notify other components
    window.dispatchEvent(new Event("storage"));
  }
};

/**
 * Deletes an activity and updates participant stats accordingly
 */
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
    updateLocalParticipantStats(activityToDelete.participantId, -activityToDelete.minutes);
    
    // Remove the activity
    const updatedActivities = parsedActivities.filter(a => a.id !== activityId);
    localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(updatedActivities));
    
    toast.success("Activity deleted! (local storage mode)");
    
    // Trigger an event to refresh the UI
    window.dispatchEvent(new Event("storage"));
  }
};

/**
 * Helper function to update participant stats in local storage
 * Only used as fallback when Supabase fails
 */
const updateLocalParticipantStats = (participantId: string, minutes: number): void => {
  const participants = localStorage.getItem("may-movement-participants");
  const parsedParticipants = participants ? JSON.parse(participants) : [];
  
  const participant = parsedParticipants.find(p => p.id === participantId);
  if (participant) {
    participant.totalMinutes = (participant.totalMinutes || 0) + minutes;
    participant.points = (participant.points || 0) + calculatePoints(minutes);
    localStorage.setItem("may-movement-participants", JSON.stringify(parsedParticipants));
  }
};
