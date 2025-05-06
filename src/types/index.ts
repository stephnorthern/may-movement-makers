
export interface Participant {
  id: string;
  name: string;
  avatar?: string;
  points: number;
  totalMinutes: number;
  teamId?: string;
}

export interface Activity {
  id: string;
  participantId: string;
  participantName: string;
  type: string;
  minutes: number;
  points: number;
  date: string;
  notes?: string;
}

export interface Team {
  id: string;
  name: string;
  color: string;
}
