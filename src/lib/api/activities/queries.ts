
import { Activity, Participant } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { calculatePoints } from "../../utils/calculations";
import { getParticipants } from "../participants";

const ACTIVITIES_KEY = "may-movement-activities";

/**
 * Fetches all activities from Supabase or falls back to local storage
 * with optimized data handling and improved caching
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

    if (!supabaseActivities || supabaseActivities.length === 0) {
      // Cache empty activities to avoid repeated calls
      localStorage.setItem(ACTIVITIES_KEY, JSON.stringify([]));
      return [];
    }

    // Get participants to map names - do this once for all activities
    const participants = await getParticipants();
    const participantsMap = new Map(
      participants.map(p => [p.id, p])
    );

    // Map Supabase data to our Activity type - improved error handling
    const formattedActivities = supabaseActivities.map(a => {
      const participant = participantsMap.get(a.participant_id) || { name: "Unknown" };
      
      // Ensure we get the exact date string in YYYY-MM-DD format, with null checks
      let dateString = a.date ? a.date.toString().split('T')[0] : "";
      
      return {
        id: a.id,
        participantId: a.participant_id,
        participantName: participant.name,
        type: a.description || "", // Ensure we have a string
        minutes: a.minutes || 0,  // Ensure we have a number
        points: typeof a.points === 'number' ? a.points : calculatePoints(a.minutes || 0),
        date: dateString,
        notes: ""  // No notes field in our DB yet
      };
    });
    
    // Cache in localStorage for fallback
    try {
      localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(formattedActivities));
    } catch (storageError) {
      console.warn("Could not cache activities in localStorage", storageError);
    }
    
    return formattedActivities;
  } catch (e) {
    console.error("Error in getActivities:", e);
    // Fall back to local storage
    const localData = localStorage.getItem(ACTIVITIES_KEY);
    return localData ? JSON.parse(localData) : [];
  }
};

/**
 * Fetches activities for a specific participant
 * with optimized data handling
 */
export const getParticipantActivities = async (participantId: string): Promise<Activity[]> => {
  try {
    // Try to get from Supabase with optimization
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
      .order('date', { ascending: false })
      .limit(20); // Limit to most recent 20 activities for performance
    
    if (error) {
      console.error("Error fetching from Supabase:", error);
      // Fall back to local storage
      const activities = localStorage.getItem(ACTIVITIES_KEY);
      const parsedActivities = activities ? JSON.parse(activities) : [];
      return parsedActivities.filter(activity => activity.participantId === participantId);
    }

    if (!supabaseActivities || supabaseActivities.length === 0) {
      return [];
    }

    // For a single participant, we only need to look up their name once
    const participants = await getParticipants();
    const participant = participants.find(p => p.id === participantId) || { name: "Unknown" };

    // Map Supabase data to our Activity type with better error handling
    return supabaseActivities.map(a => {
      // Ensure we get the exact date string in YYYY-MM-DD format
      let dateString = a.date ? a.date.toString().split('T')[0] : "";
      
      return {
        id: a.id,
        participantId: a.participant_id,
        participantName: participant.name,
        type: a.description || "",
        minutes: a.minutes || 0,
        points: typeof a.points === 'number' ? a.points : calculatePoints(a.minutes || 0),
        date: dateString,
        notes: ""
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
