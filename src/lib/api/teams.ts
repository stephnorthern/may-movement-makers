
import { Team } from "@/types";
import { toast } from "sonner";
import { getParticipants } from "./participants";

const TEAMS_KEY = "may-movement-teams";

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
  localStorage.setItem("may-movement-participants", JSON.stringify(updatedParticipants));
  
  // Then delete the team
  const teams = getTeams();
  const filteredTeams = teams.filter(t => t.id !== id);
  localStorage.setItem(TEAMS_KEY, JSON.stringify(filteredTeams));
  
  toast.success(`Team deleted!`);
};
