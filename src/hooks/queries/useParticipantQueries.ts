import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

export const QUERY_KEYS = {
  participants: "participants",
  teamMembers: "teamMembers",
  teams: "teams",
  activities: "activities",
};

export const useParticipantQueries = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const participantsQuery = useQuery({
    queryKey: [QUERY_KEYS.participants],
    queryFn: async () => {
      const { data, error } = await supabase.from('participants').select('*');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 30000, // 30 seconds
  });

  const teamMembersQuery = useQuery({
    queryKey: [QUERY_KEYS.teamMembers],
    queryFn: async () => {
      const { data, error } = await supabase.from('team_members').select('*');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 30000,
  });

  const teamsQuery = useQuery({
    queryKey: [QUERY_KEYS.teams],
    queryFn: async () => {
      const { data, error } = await supabase.from('teams').select('*');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 30000,
  });

  const activitiesQuery = useQuery({
    queryKey: [QUERY_KEYS.activities],
    queryFn: async () => {
      const { data, error } = await supabase.from('activities').select('*');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 30000,
  });

  // Subscribe to realtime changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel('db-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'participants' },
        () => queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.participants] }))
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'team_members' },
        () => queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.teamMembers] }))
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'teams' },
        () => queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.teams] }))
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'activities' },
        () => queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.activities] }))
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user, queryClient]);

  return {
    participants: participantsQuery.data ?? [],
    teams: teamsQuery.data ?? [],
    teamMembers: teamMembersQuery.data ?? [],
    activities: activitiesQuery.data ?? [],
    isLoading: 
      participantsQuery.isLoading || 
      teamMembersQuery.isLoading || 
      teamsQuery.isLoading || 
      activitiesQuery.isLoading,
    isError:
      participantsQuery.isError ||
      teamMembersQuery.isError ||
      teamsQuery.isError ||
      activitiesQuery.isError,
    error: 
      participantsQuery.error ||
      teamMembersQuery.error ||
      teamsQuery.error ||
      activitiesQuery.error
  };
}; 