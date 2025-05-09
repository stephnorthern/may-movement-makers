
import { Activity, Participant } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { calculatePoints } from "../../utils/calculations";
import { getParticipants } from "../participants";

const ACTIVITIES_KEY = "may-movement-activities";

/**
 * Fetches all activities from Supabase or falls back to local storage
 */
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
      .order('date', { ascending: false });
    
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
    const participants = await getParticipants();
    const participantsMap = new Map(
      participants.map(p => [p.id, p])
    );

    // Map Supabase data to our Activity type
    return supabaseActivities.map(a => {
      const participant = participantsMap.get(a.participant_id) || { name: "Unknown" };
      
      // Extract just the YYYY-MM-DD part without any timezone conversions
      // This ensures the date is consistent across different timezones
      const dateString = a.date ? a.date.split('T')[0] : "";
      
      console.log('Raw date from DB:', a.date, 'Parsed date:', dateString);
      
      return {
        id: a.id,
        participantId: a.participant_id,
        participantName: participant.name,
        type: a.description, // Map description to type
        minutes: a.minutes,
        points: a.points || calculatePoints(a.minutes),
        date: dateString, // Format date correctly without timezone issues
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

/**
 * Fetches activities for a specific participant
 */
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
      .order('date', { ascending: false });
    
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
    const participants = await getParticipants();
    const participant = participants.find(p => p.id === participantId) || { name: "Unknown" };

    // Map Supabase data to our Activity type
    return supabaseActivities.map(a => {
      // Extract just the YYYY-MM-DD part without any timezone conversions
      const dateString = a.date ? a.date.split('T')[0] : "";
      
      console.log('Raw participant activity date from DB:', a.date, 'Parsed date:', dateString);
      
      return {
        id: a.id,
        participantId: a.participant_id,
        participantName: participant.name,
        type: a.description, // Map description to type
        minutes: a.minutes,
        points: a.points || calculatePoints(a.minutes),
        date: dateString, // Format date correctly
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
