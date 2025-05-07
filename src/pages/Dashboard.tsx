
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, Participant, Team } from "@/types";
import { getActivities } from "@/lib/api/activities";
import { getParticipants } from "@/lib/api/participants";
import { getTeams, addTeam, updateTeam, deleteTeam } from "@/lib/api/teams";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Users, Plus, UserRound } from "lucide-react";
import { format } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";
import TeamsList from "@/components/teams/TeamsList";
import EmptyTeamState from "@/components/teams/EmptyTeamState";
import TeamMembersView from "@/components/teams/TeamMembersView";
import AddTeamDialog from "@/components/teams/AddTeamDialog";
import ChallengeHeader from "@/components/teams/ChallengeHeader";

const Dashboard = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTeam, setSelectedTeam] = useState<Team & {
    totalPoints: number;
    totalMinutes: number;
    memberCount: number;
    members: Participant[];
  } | null>(null);
  const [isViewMembersOpen, setIsViewMembersOpen] = useState(false);
  const isMobile = useIsMobile();
  
  const loadData = async () => {
    setIsLoading(true);
    try {
      const activitiesData = await getActivities();
      const participantsData = await getParticipants();
      const teamsData = await getTeams();
      
      // Sort activities by date (newest first)
      const sortedActivities = [...activitiesData].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setActivities(sortedActivities);
      
      // Sort participants by points (highest first)
      const sortedParticipants = [...participantsData].sort((a, b) => b.points - a.points);
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
  
  // Get activities for the selected date
  const activitiesForDate = selectedDate
    ? activities.filter(
        activity => activity.date === selectedDate.toISOString().split('T')[0]
      )
    : [];
    
  const handleAddTeam = (name: string, color: string) => {
    addTeam({
      name,
      color
    });
    loadData();
  };

  const handleDeleteTeam = (teamId: string) => {
    if (confirm("Are you sure you want to delete this team? All members will be removed from the team.")) {
      deleteTeam(teamId);
      loadData();
    }
  };

  const handleUpdateTeam = (teamId: string, name: string, color: string) => {
    updateTeam(teamId, {
      name,
      color
    });
    loadData();
  };

  const teamMembers = (teamId: string) => {
    return participants.filter(p => p.teamId === teamId);
  };

  // Calculate team totals and sort by points
  const teamsWithTotals = teams.map(team => {
    const members = teamMembers(team.id);
    const totalTeamPoints = members.reduce((sum, member) => sum + member.points, 0);
    const totalTeamMinutes = members.reduce((sum, member) => sum + member.totalMinutes, 0);
    return {
      ...team,
      totalPoints: totalTeamPoints,
      totalMinutes: totalTeamMinutes,
      memberCount: members.length,
      members
    };
  }).sort((a, b) => b.totalPoints - a.totalPoints); // Sort by total points (descending)
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold gradient-text">May Movement Challenge</h1>
        <p className="text-gray-600">Track your progress and stay motivated!</p>
      </div>
      
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-movement-green border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Loading data...</p>
        </div>
      ) : (
        <>
          {/* Main dashboard grid with teams and calendar side by side */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Team Standings Section - Left side (wider) */}
            <div className="md:col-span-7 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-semibold">Team Standings</h2>
                  <p className="text-gray-600">Track team progress in the challenge</p>
                </div>
                <AddTeamDialog 
                  onAddTeam={handleAddTeam}
                  teams={teams}
                />
              </div>
              
              <ChallengeHeader hasTeams={teams.length > 0} />
              
              <TeamsList 
                teams={teamsWithTotals} 
                handleDeleteTeam={handleDeleteTeam}
                handleUpdateTeam={handleUpdateTeam}
                setSelectedTeam={setSelectedTeam}
                setIsViewMembersOpen={setIsViewMembersOpen}
                allTeams={teams}
              />
            </div>
            
            {/* Activity Calendar Card - Right side */}
            <div className="md:col-span-5">
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold">Activity Calendar</CardTitle>
                    <Link to="/activities">
                      <Button variant="ghost" size="sm">
                        <CalendarIcon className="mr-2 h-4 w-4" /> View All
                      </Button>
                    </Link>
                  </div>
                  <CardDescription>Track your exercise days</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border"
                  />
                  {selectedDate && (
                    <div className="mt-2 overflow-auto max-h-48">
                      <h4 className="font-semibold">
                        Activities for {format(selectedDate, 'MMMM d, yyyy')}
                      </h4>
                      {activitiesForDate.length > 0 ? (
                        <ul className="list-disc pl-5 mt-2">
                          {activitiesForDate.map(activity => (
                            <li key={activity.id} className="mb-1">
                              <div className="flex items-center gap-1">
                                <UserRound className="h-3 w-3 text-movement-green" />
                                <span className="text-movement-green font-medium">{activity.participantName}</span>
                                <span>•</span>
                                <span>{activity.type} - {activity.minutes} minutes</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500 mt-2">No activities for this day.</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Team Members View Modal */}
          {selectedTeam && (
            <TeamMembersView
              selectedTeam={selectedTeam}
              teamMembers={teamMembers(selectedTeam.id)}
              isViewMembersOpen={isViewMembersOpen}
              setIsViewMembersOpen={setIsViewMembersOpen}
              isMobile={isMobile}
            />
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
