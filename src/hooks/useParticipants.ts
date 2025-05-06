
import { useState, useEffect } from "react";
import { Participant, Team, Activity } from "@/types";
import { getParticipants, getParticipantActivities, getTeams } from "@/lib/local-storage";
import { toast } from "sonner";

export const useParticipants = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [participantActivities, setParticipantActivities] = useState<Record<string, Activity[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  
  const loadData = async () => {
    setIsLoading(true);
    try {
      const participantsData = getParticipants();
      const teamsData = getTeams();
      
      // Sort by points (highest first)
      const sortedData = [...participantsData].sort((a, b) => b.points - a.points);
      setParticipants(sortedData);
      setTeams(teamsData);
      
      // Load activities for each participant
      const activitiesMap: Record<string, Activity[]> = {};
      for (const participant of participantsData) {
        const activities = await getParticipantActivities(participant.id);
        activitiesMap[participant.id] = activities;
      }
      setParticipantActivities(activitiesMap);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    loadData();
    
    // Listen for storage changes
    const handleStorageChange = () => {
      loadData();
    };
    
    window.addEventListener("storage", handleStorageChange);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);
  
  const getTeamById = (teamId?: string) => {
    if (!teamId) return null;
    return teams.find(team => team.id === teamId) || null;
  };

  return {
    participants,
    teams,
    participantActivities,
    isLoading,
    loadData,
    getTeamById
  };
};
