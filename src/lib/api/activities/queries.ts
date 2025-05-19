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
    // First, try to get from Supabase with sensible limits
    const { data: supabaseActivities, error } = await supabase
      .from('activities')
      .select(`
        id,
        participant_id,
        description,
        minutes,
        date,
        points,
        participants (
          id,
          name
        )
      `)
      .order('date', { ascending: false })
      .limit(100);
    
    if (error) {
      console.error("Error fetching from Supabase:", error);
      const localData = localStorage.getItem(ACTIVITIES_KEY);
      return localData ? JSON.parse(localData) : [];
    }

    if (!supabaseActivities || supabaseActivities.length === 0) {
      localStorage.setItem(ACTIVITIES_KEY, JSON.stringify([]));
      return [];
    }

    // Map Supabase data to our Activity type with proper field mapping
    const formattedActivities = supabaseActivities.map(a => {
      // Ensure we get the exact date string in YYYY-MM-DD format
      const dateString = a.date ? a.date.split('T')[0] : "";

      return {
        id: a.id,
        participantId: a.participant_id,
        participantName: a.participants?.name || "Unknown",
        type: a.description || "",
        minutes: a.minutes || 0,
        points: typeof a.points === 'number' ? a.points : calculatePoints(a.minutes || 0),
        date: dateString,
        notes: ""
      };
    });
    
    console.log("Formatted activities:", formattedActivities[0]); // Debug log
    return formattedActivities;
  } catch (e) {
    console.error("Error in getActivities:", e);
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
