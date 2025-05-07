
import { useState, useEffect } from "react";
import { Participant, Team, Activity } from "@/types";
import { getActivities, getParticipantActivities } from "@/lib/api/activities";
import { getParticipants } from "@/lib/api/participants";
import { getTeams } from "@/lib/api/teams";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useParticipants = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [participantActivities, setParticipantActivities] = useState<Record<string, Activity[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  
  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load participants from Supabase
      const { data: participantsData, error: participantsError } = await supabase
        .from('participants')
        .select('*');
      
      if (participantsError) {
        console.error("Error loading participants:", participantsError);
        throw participantsError;
      }
      
      // Load team members to get team associations
      const { data: teamMembersData, error: teamMembersError } = await supabase
        .from('team_members')
        .select('*');
      
      if (teamMembersError) {
        console.error("Error loading team members:", teamMembersError);
      }
      
      // Load teams
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*');
      
      if (teamsError) {
        console.error("Error loading teams:", teamsError);
        throw teamsError;
      }
      
      // Load activities to calculate points
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('activities')
        .select('*');
      
      if (activitiesError) {
        console.error("Error loading activities:", activitiesError);
      }
      
      // Calculate points for each participant
      const participantsWithPoints = participantsData.map(participant => {
        // Find activities for this participant
        const participantActivities = activitiesData?.filter(
          activity => activity.participant_id === participant.id
        ) || [];
        
        // Calculate total points
        const points = participantActivities.reduce((sum, activity) => sum + activity.points, 0);
        
        // Find team association
        const teamMember = teamMembersData?.find(
          tm => tm.participant_id === participant.id
        );
        
        return {
          id: participant.id,
          name: participant.name,
          points: points,
          totalMinutes: participant.total_minutes || 0,
          teamId: teamMember?.team_id
        };
      });
      
      // Sort by points (highest first)
      const sortedData = [...participantsWithPoints].sort((a, b) => b.points - a.points);
      
      setParticipants(sortedData);
      setTeams(teamsData.map(team => ({
        id: team.id,
        name: team.name,
        color: team.color
      })));
      
      // Load activities for each participant
      const activitiesMap: Record<string, Activity[]> = {};
      for (const participant of participantsWithPoints) {
        try {
          const { data: participantActivities, error } = await supabase
            .from('activities')
            .select('*')
            .eq('participant_id', participant.id)
            .order('date', { ascending: false });
          
          if (error) {
            console.error(`Error loading activities for participant ${participant.id}:`, error);
            continue;
          }
          
          activitiesMap[participant.id] = participantActivities.map(activity => ({
            id: activity.id,
            participantId: activity.participant_id,
            participantName: participant.name,
            type: activity.description,
            minutes: activity.minutes,
            points: activity.points,
            date: activity.date.split('T')[0],
            notes: ""
          }));
        } catch (e) {
          console.error(`Error processing activities for participant ${participant.id}:`, e);
        }
      }
      
      setParticipantActivities(activitiesMap);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data");
      
      // Fall back to original implementation if Supabase fails
      try {
        const participantsData = await getParticipants();
        const teamsData = await getTeams();
        
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
      } catch (fallbackError) {
        console.error("Error in fallback loading:", fallbackError);
        toast.error("All data loading methods failed");
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    loadData();
    
    // Set up a Supabase realtime subscription
    const participantsChannel = supabase
      .channel('public:participants')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'participants' },
        () => {
          console.log('Participants table updated, reloading data');
          loadData();
        }
      )
      .subscribe();
    
    const activitiesChannel = supabase
      .channel('public:activities')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'activities' },
        () => {
          console.log('Activities table updated, reloading data');
          loadData();
        }
      )
      .subscribe();
    
    const teamsChannel = supabase
      .channel('public:teams')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'teams' },
        () => {
          console.log('Teams table updated, reloading data');
          loadData();
        }
      )
      .subscribe();
    
    const teamMembersChannel = supabase
      .channel('public:team_members')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'team_members' },
        () => {
          console.log('Team members table updated, reloading data');
          loadData();
        }
      )
      .subscribe();
    
    // Also listen for storage events as a fallback
    const handleStorageChange = () => {
      loadData();
    };
    
    window.addEventListener("storage", handleStorageChange);
    
    return () => {
      // Clean up subscribers
      supabase.removeChannel(participantsChannel);
      supabase.removeChannel(activitiesChannel);
      supabase.removeChannel(teamsChannel);
      supabase.removeChannel(teamMembersChannel);
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
