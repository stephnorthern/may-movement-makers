
import { useEffect, useState } from "react";
import { Activity, Participant, Team } from "@/types";
import { getActivities } from "@/lib/api/activities";
import { getParticipants } from "@/lib/api/participants";
import { getTeams } from "@/lib/api/teams";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import TeamStandingsSection from "@/components/dashboard/TeamStandingsSection";
import ActivityCalendarSection from "@/components/dashboard/ActivityCalendarSection";
import LoadingIndicator from "@/components/dashboard/LoadingIndicator";

const Dashboard = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const loadData = async () => {
    setIsLoading(true);
    try {
      const activitiesData = await getActivities();
      const participantsData = await getParticipants();
      const teamsData = await getTeams();

      // Sort activities by date (newest first)
      const sortedActivities = [...activitiesData].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setActivities(sortedActivities);

      // Sort participants by points (highest first)
      const sortedParticipants = [...participantsData].sort(
        (a, b) => b.points - a.points
      );
      setParticipants(sortedParticipants);
      setTeams(teamsData);
    } catch (error) {
      console.error("Error loading data:", error);
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


  return (
    <div className="space-y-6">
      <DashboardHeader />
      
      {isLoading ? (
        <LoadingIndicator />
      ) : (
        <>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <TeamStandingsSection
                teams={teams}
                participants={participants}
                loadData={loadData}
              />
            </div>

            <div className="w-full md:w-[360px] shrink-0">
              <ActivityCalendarSection activities={activities} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
