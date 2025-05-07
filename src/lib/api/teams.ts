
import { Team } from "@/types";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Team Methods
export const getTeams = async (): Promise<Team[]> => {
  try {
    const { data: teams, error } = await supabase
      .from('teams')
      .select('*');
    
    if (error) {
      console.error("Error fetching teams:", error);
      throw error;
    }
    
    return teams.map(team => ({
      id: team.id,
      name: team.name,
      color: team.color
    }));
  } catch (e) {
    console.error("Error in getTeams:", e);
    // Fall back to local storage
    const data = localStorage.getItem("may-movement-teams");
    return data ? JSON.parse(data) : [];
  }
};

export const getTeam = async (id: string): Promise<Team | undefined> => {
  try {
    const { data: team, error } = await supabase
      .from('teams')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error("Error fetching team:", error);
      throw error;
    }
    
    if (!team) return undefined;
    
    return {
      id: team.id,
      name: team.name,
      color: team.color
    };
  } catch (e) {
    console.error("Error in getTeam:", e);
    // Fall back to local storage
    const teams = localStorage.getItem("may-movement-teams");
    const parsedTeams = teams ? JSON.parse(teams) : [];
    return parsedTeams.find(t => t.id === id);
  }
};

export const addTeam = async (team: Omit<Team, "id">): Promise<void> => {
  try {
    // Generate UUID
    const id = crypto.randomUUID();
    
    const { error } = await supabase
      .from('teams')
      .insert({
        id: id,
        name: team.name,
        color: team.color
      });
    
    if (error) {
      console.error("Error adding team:", error);
      throw error;
    }
    
    toast.success(`Team ${team.name} added!`);
    // Trigger event to refresh UI
    window.dispatchEvent(new Event("storage"));
    
  } catch (e) {
    console.error("Error in addTeam:", e);
    // Fall back to local storage
    const teams = localStorage.getItem("may-movement-teams");
    const parsedTeams = teams ? JSON.parse(teams) : [];
    
    const newTeam: Team = {
      ...team,
      id: Date.now().toString()
    };
    
    localStorage.setItem("may-movement-teams", JSON.stringify([...parsedTeams, newTeam]));
    toast.success(`Team ${team.name} added! (local storage mode)`);
    // Dispatch event to notify other components
    window.dispatchEvent(new Event("storage"));
  }
};

export const updateTeam = async (id: string, updates: Partial<Omit<Team, "id">>): Promise<void> => {
  try {
    const { error } = await supabase
      .from('teams')
      .update(updates)
      .eq('id', id);
    
    if (error) {
      console.error("Error updating team:", error);
      throw error;
    }
    
    toast.success(`Team updated!`);
    // Trigger event to refresh UI
    window.dispatchEvent(new Event("storage"));
    
  } catch (e) {
    console.error("Error in updateTeam:", e);
    // Fall back to local storage
    const teams = localStorage.getItem("may-movement-teams");
    const parsedTeams = teams ? JSON.parse(teams) : [];
    const teamIndex = parsedTeams.findIndex(t => t.id === id);
    
    if (teamIndex === -1) return;
    
    parsedTeams[teamIndex] = { ...parsedTeams[teamIndex], ...updates };
    localStorage.setItem("may-movement-teams", JSON.stringify(parsedTeams));
    toast.success(`Team updated! (local storage mode)`);
    // Dispatch event to notify other components
    window.dispatchEvent(new Event("storage"));
  }
};

export const deleteTeam = async (id: string): Promise<void> => {
  try {
    // First, remove team associations from team_members
    const { error: teamMemberError } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', id);
      
    if (teamMemberError) {
      console.error("Error removing team members:", teamMemberError);
      // Continue with team deletion anyway
    }
    
    // Delete the team
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error("Error deleting team:", error);
      throw error;
    }
    
    toast.success(`Team deleted!`);
    // Trigger event to refresh UI
    window.dispatchEvent(new Event("storage"));
    
  } catch (e) {
    console.error("Error in deleteTeam:", e);
    
    // Fall back to local storage method
    // First, remove team from all participants
    const participants = localStorage.getItem("may-movement-participants");
    const parsedParticipants = participants ? JSON.parse(participants) : [];
    
    const updatedParticipants = parsedParticipants.map(p => {
      if (p.teamId === id) {
        const { teamId, ...rest } = p;
        return rest;
      }
      return p;
    });
    
    localStorage.setItem("may-movement-participants", JSON.stringify(updatedParticipants));
    
    // Then delete the team
    const teams = localStorage.getItem("may-movement-teams");
    const parsedTeams = teams ? JSON.parse(teams) : [];
    const filteredTeams = parsedTeams.filter(t => t.id !== id);
    
    localStorage.setItem("may-movement-teams", JSON.stringify(filteredTeams));
    toast.success(`Team deleted! (local storage mode)`);
    
    // Dispatch event to notify other components
    window.dispatchEvent(new Event("storage"));
  }
};
