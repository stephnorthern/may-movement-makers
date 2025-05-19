import { supabase } from "@/integrations/supabase/client";
import { Activity, Participant, Team } from "@/types";
import { toast } from "sonner";

class ParticipantDataManager {
  private static instance: ParticipantDataManager;
  private isLoading = false;
  private lastLoadTime = 0;
  private loadPromise: Promise<void> | null = null;
  private channel: any | null = null;

  private constructor() {}

  static getInstance() {
    if (!this.instance) {
      this.instance = new ParticipantDataManager();
    }
    return this.instance;
  }

  async loadData() {
    if (this.isLoading) {
      console.log("Already loading data, waiting for current load to complete");
      return this.loadPromise;
    }

    // If data was loaded in the last 30 seconds, don't reload
    if (Date.now() - this.lastLoadTime < 30000) {
      console.log("Using recently loaded data");
      return;
    }

    this.isLoading = true;
    this.loadPromise = new Promise(async (resolve, reject) => {
      try {
        const [participantsResult, teamMembersResult, teamsResult, activitiesResult] = await Promise.all([
          supabase.from('participants').select('*'),
          supabase.from('team_members').select('*'),
          supabase.from('teams').select('*'),
          supabase.from('activities').select('*')
        ]);

        if (participantsResult.error) throw participantsResult.error;
        if (teamMembersResult.error) throw teamMembersResult.error;
        if (teamsResult.error) throw teamsResult.error;
        if (activitiesResult.error) throw activitiesResult.error;

        // Process and store data
        const processedData = this.processData(
          participantsResult.data,
          teamMembersResult.data,
          teamsResult.data,
          activitiesResult.data
        );

        // Update local storage
        localStorage.setItem('participants_cache', JSON.stringify(processedData.participants));
        localStorage.setItem('teams_cache', JSON.stringify(processedData.teams));

        this.lastLoadTime = Date.now();
        resolve();
      } catch (error) {
        console.error("Error loading data:", error);
        reject(error);
      } finally {
        this.isLoading = false;
        this.loadPromise = null;
      }
    });

    return this.loadPromise;
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
}

export const participantDataManager = ParticipantDataManager.getInstance(); 