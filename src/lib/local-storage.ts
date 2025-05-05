
import { Participant, Activity } from "@/types";
import { toast } from "sonner";

const PARTICIPANTS_KEY = "may-movement-participants";
const ACTIVITIES_KEY = "may-movement-activities";

// Helper to calculate points from minutes
export const calculatePoints = (minutes: number): number => {
  return Math.floor(minutes / 15);
};

// Initialize with sample data if empty
const initializeData = () => {
  if (!localStorage.getItem(PARTICIPANTS_KEY)) {
    const sampleParticipants: Participant[] = [
      {
        id: "1",
        name: "Emma Johnson",
        points: 12,
        totalMinutes: 180,
      },
      {
        id: "2",
        name: "Alex Rodriguez",
        points: 8,
        totalMinutes: 120,
      },
      {
        id: "3",
        name: "Taylor Wilson",
        points: 15,
        totalMinutes: 225,
      }
    ];
    localStorage.setItem(PARTICIPANTS_KEY, JSON.stringify(sampleParticipants));
    
    // Add some sample activities
    const sampleActivities: Activity[] = [
      {
        id: "a1",
        participantId: "1",
        participantName: "Emma Johnson",
        type: "Running",
        minutes: 45,
        points: 3,
        date: "2025-05-01",
        notes: "Morning jog"
      },
      {
        id: "a2",
        participantId: "2",
        participantName: "Alex Rodriguez",
        type: "Yoga",
        minutes: 60,
        points: 4,
        date: "2025-05-02"
      },
      {
        id: "a3",
        participantId: "3",
        participantName: "Taylor Wilson",
        type: "Swimming",
        minutes: 75,
        points: 5,
        date: "2025-05-03",
        notes: "Pool workout"
      }
    ];
    localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(sampleActivities));
  }
};

// Initialize on import
initializeData();

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
