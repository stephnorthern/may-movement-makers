
import { Participant, Activity, Team } from "@/types";
import { toast } from "sonner";

const PARTICIPANTS_KEY = "may-movement-participants";
const ACTIVITIES_KEY = "may-movement-activities";
const TEAMS_KEY = "may-movement-teams";

// Helper to calculate points from minutes
export const calculatePoints = (minutes: number): number => {
  return Math.floor(minutes / 15);
};

// Participant Methods
export const getParticipants = (): Participant[] => {
  const data = localStorage.getItem(PARTICIPANTS_KEY);
  return data ? JSON.parse(data) : [];
};

export const getParticipant = (id: string): Participant | undefined => {
  const participants = getParticipants();
  return participants.find(p => p.id === id);
};

export const addParticipant = (participant: Omit<Participant, "id" | "points" | "totalMinutes">): void => {
  const participants = getParticipants();
  const newParticipant: Participant = {
    ...participant,
    id: Date.now().toString(), // Simple ID generation
    points: 0,
    totalMinutes: 0
  };
  
  localStorage.setItem(PARTICIPANTS_KEY, JSON.stringify([...participants, newParticipant]));
  toast.success(`${participant.name} added to challenge!`);
};

export const updateParticipantStats = (participantId: string, additionalMinutes: number): void => {
  const participants = getParticipants();
  const participantIndex = participants.findIndex(p => p.id === participantId);
  
  if (participantIndex === -1) return;
  
  const additionalPoints = calculatePoints(additionalMinutes);
  const participant = participants[participantIndex];
  
  participant.totalMinutes += additionalMinutes;
  participant.points += additionalPoints;
  
  participants[participantIndex] = participant;
  localStorage.setItem(PARTICIPANTS_KEY, JSON.stringify(participants));
};

export const assignParticipantToTeam = (participantId: string, teamId: string | null): void => {
  const participants = getParticipants();
  const participantIndex = participants.findIndex(p => p.id === participantId);
  
  if (participantIndex === -1) return;
  
  const participant = participants[participantIndex];
  
  if (teamId) {
    participant.teamId = teamId;
    toast.success(`${participant.name} added to team!`);
  } else {
    delete participant.teamId;
    toast.success(`${participant.name} removed from team!`);
  }
  
  participants[participantIndex] = participant;
  localStorage.setItem(PARTICIPANTS_KEY, JSON.stringify(participants));
};

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
  localStorage.setItem(PARTICIPANTS_KEY, JSON.stringify(updatedParticipants));
  
  // Then delete the team
  const teams = getTeams();
  const filteredTeams = teams.filter(t => t.id !== id);
  localStorage.setItem(TEAMS_KEY, JSON.stringify(filteredTeams));
  
  toast.success(`Team deleted!`);
};

// Activity Methods
export const getActivities = (): Activity[] => {
  const data = localStorage.getItem(ACTIVITIES_KEY);
  return data ? JSON.parse(data) : [];
};

export const getParticipantActivities = (participantId: string): Activity[] => {
  const activities = getActivities();
  return activities.filter(activity => activity.participantId === participantId);
};

export const addActivity = (activity: Omit<Activity, "id" | "points">): void => {
  const activities = getActivities();
  const points = calculatePoints(activity.minutes);
  
  const newActivity: Activity = {
    ...activity,
    id: Date.now().toString(),
    points
  };
  
  localStorage.setItem(ACTIVITIES_KEY, JSON.stringify([...activities, newActivity]));
  
  // Update participant's total stats
  updateParticipantStats(activity.participantId, activity.minutes);
  
  toast.success(`Activity added: ${points} points earned!`);
};

export const deleteActivity = (activityId: string): void => {
  const activities = getActivities();
  const activityToDelete = activities.find(a => a.id === activityId);
  
  if (!activityToDelete) return;
  
  // Update participant stats (subtract the activity)
  const participants = getParticipants();
  const participant = participants.find(p => p.id === activityToDelete.participantId);
  
  if (participant) {
    participant.totalMinutes -= activityToDelete.minutes;
    participant.points -= activityToDelete.points;
    localStorage.setItem(PARTICIPANTS_KEY, JSON.stringify(participants));
  }
  
  // Remove the activity
  const updatedActivities = activities.filter(a => a.id !== activityId);
  localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(updatedActivities));
  
  toast.success("Activity deleted!");
};
