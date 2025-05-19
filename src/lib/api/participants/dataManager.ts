/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "@/integrations/supabase/client";
import { Activity, Participant, Team } from "@/types";
import { toast } from "sonner";
import { RealtimeChannel } from '@supabase/supabase-js';

class ParticipantDataManager {
  private static instance: ParticipantDataManager;
  private isLoading = false;
  private lastLoadTime = 0;
  private loadPromise: Promise<void> | null = null;
  private subscribers: Set<() => void> = new Set();
  private channel: RealtimeChannel | null = null;

  private constructor() {
    // Initialize realtime subscription
    this.channel = supabase.channel('db-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'participants' },
        () => this.notifySubscribers())
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'team_members' },
        () => this.notifySubscribers())
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'activities' },
        () => this.notifySubscribers());

    this.channel.subscribe();
  }

  public cleanup() {
    if (this.channel) {
      this.channel.unsubscribe();
      this.channel = null;
    }
    this.subscribers.clear();
  }

  async loadData(forceFresh = false) {
    if (this.isLoading) {
      console.log("Already loading data, waiting for current load to complete");
      return this.loadPromise;
    }

    // If data was loaded recently and we're not forcing a fresh load
    if (!forceFresh && Date.now() - this.lastLoadTime < 30000) {
      console.log("Using recently loaded data");
      return;
    }

    this.isLoading = true;
    this.loadPromise = this.performLoad();
    return this.loadPromise;
  }

  private async performLoad() {
    try {
      const [participantsResult, teamMembersResult, teamsResult, activitiesResult] = 
        await Promise.all([
          supabase.from('participants').select('*'),
          supabase.from('team_members').select('*'),
          supabase.from('teams').select('*'),
          supabase.from('activities').select('*')
        ]);

      // Process and store data
      const processedData = this.processData(
        participantsResult.data || [],
        teamMembersResult.data || [],
        teamsResult.data || [],
        activitiesResult.data || []
      );

      localStorage.setItem('participants_cache', JSON.stringify(processedData.participants));
      localStorage.setItem('teams_cache', JSON.stringify(processedData.teams));

      this.lastLoadTime = Date.now();
      this.notifySubscribers();
    } finally {
      this.isLoading = false;
      this.loadPromise = null;
    }
  }

  private processData(participants: any[], teamMembers: any[], teams: any[], activities: any[]) {
    // Create a map for quick lookups
    const teamMembersMap = new Map(
      teamMembers.map(tm => [tm.participant_id, tm.team_id])
    );

    // Process participants with their points and team associations
    const processedParticipants = participants.map(participant => {
      // Find activities for this participant
      const participantActivities = activities.filter(
        activity => activity.participant_id === participant.id
      );
      
      // Calculate total points
      const points = participantActivities.reduce(
        (sum, activity) => sum + (activity.points || 0), 
        0
      );
      
      return {
        id: participant.id,
        name: participant.name,
        points,
        totalMinutes: participant.total_minutes || 0,
        teamId: teamMembersMap.get(participant.id)
      };
    });

    // Process teams with their members
    const processedTeams = teams.map(team => ({
      id: team.id,
      name: team.name,
      color: team.color
    }));

    return {
      participants: processedParticipants,
      teams: processedTeams
    };
  }

  async setupRealtimeSubscription(onDataChange: () => void) {
    if (this.channel) {
      this.channel.unsubscribe();
    }

    this.channel = supabase.channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        // Debounce the data reload
        if (!this.isLoading && Date.now() - this.lastLoadTime >= 3000) {
          this.loadData().then(onDataChange);
        }
      })
      .subscribe();

    return () => {
      if (this.channel) {
        this.channel.unsubscribe();
        this.channel = null;
      }
    };
  }

  subscribe(callback: () => void) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => callback());
  }

  public static getInstance(): ParticipantDataManager {
    if (!ParticipantDataManager.instance) {
      ParticipantDataManager.instance = new ParticipantDataManager();
    }
    return ParticipantDataManager.instance;
  }
}

export const participantDataManager = ParticipantDataManager.getInstance(); 