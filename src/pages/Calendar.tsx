
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Activity } from "@/types";
import { getActivities } from "@/lib/api/activities";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Calendar as CalendarIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useParticipants } from "@/hooks/useParticipants";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const Calendar = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const { teams, participants, isLoading: isTeamsLoading } = useParticipants();
  
  useEffect(() => {
    const loadActivities = async () => {
      setIsLoading(true);
      try {
        const data = await getActivities();
        setActivities(data);
      } catch (error) {
        console.error("Error loading activities:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadActivities();
    
    // Listen for storage changes
    const handleStorageChange = () => {
      loadActivities();
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
  
  // Create a map of dates to total points for highlighting the calendar
  const dateToPoints: Record<string, number> = {};
  activities.forEach(activity => {
    if (!dateToPoints[activity.date]) {
      dateToPoints[activity.date] = 0;
    }
    dateToPoints[activity.date] += activity.points;
  });
  
  // Calculate team points for the selected date
  const getTeamPointsByDate = () => {
    if (!selectedDate || isTeamsLoading) return [];
    
    // Create a map of team ID to points
    const teamPoints: Record<string, number> = {};
    const teamParticipantCounts: Record<string, number> = {};
    
    // Initialize with all teams (even those with zero points)
    teams.forEach(team => {
      teamPoints[team.id] = 0;
      teamParticipantCounts[team.id] = 0;
    });
    
    // Count participants per team
    participants.forEach(participant => {
      if (participant.teamId) {
        teamParticipantCounts[participant.teamId] = 
          (teamParticipantCounts[participant.teamId] || 0) + 1;
      }
    });
    
    // Calculate points for each team based on activities
    activitiesForDate.forEach(activity => {
      // Find participant's team
      const participant = participants.find(p => p.id === activity.participantId);
      if (participant?.teamId) {
        teamPoints[participant.teamId] = (teamPoints[participant.teamId] || 0) + activity.points;
      }
    });
    
    // Convert to array and sort by points (highest first)
    return teams
      .map(team => ({
        ...team,
        points: teamPoints[team.id] || 0,
        participantCount: teamParticipantCounts[team.id] || 0
      }))
      .sort((a, b) => b.points - a.points);
  };
  
  // Get team points for display
  const teamPointsForDate = getTeamPointsByDate();
  
  // Generate dates with activities for the calendar
  const datesWithActivities = Object.keys(dateToPoints).map(date => new Date(date));
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Calendar</h1>
          <p className="text-gray-600">View team performance by date</p>
        </div>
        <Link to="/activities/new">
          <Button className="bg-movement-green hover:bg-movement-dark-green">
            <Plus className="mr-2 h-4 w-4" /> Log Activity
          </Button>
        </Link>
      </div>
      
      {isLoading || isTeamsLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-movement-green border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Loading data...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-movement-green" />
                  May Movement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                  modifiers={{
                    highlighted: datesWithActivities,
                  }}
                  modifiersStyles={{
                    highlighted: {
                      backgroundColor: "rgb(232, 245, 233)",
                      fontWeight: "bold"
                    },
                  }}
                  fromDate={new Date("2025-05-01")}
                  toDate={new Date("2025-06-02")}
                />
                <div className="mt-4 text-sm text-center text-gray-600">
                  <p>May 1 - June 2, 2025</p>
                  <p className="flex items-center justify-center gap-2 mt-2">
                    <span className="w-3 h-3 bg-movement-light-green rounded-full"></span>
                    <span>Dates with recorded activities</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedDate ? (
                    <>Team Points for {selectedDate.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric',
                      year: 'numeric'
                    })}</>
                  ) : (
                    "Select a date to view team points"
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {teamPointsForDate.length > 0 ? (
                  <div className="space-y-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Team</TableHead>
                          <TableHead>Members</TableHead>
                          <TableHead className="text-right">Points</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {teamPointsForDate.map(team => (
                          <TableRow key={team.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: team.color }}
                                ></div>
                                <span>{team.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>{team.participantCount}</TableCell>
                            <TableCell className="font-bold text-right">
                              {team.points}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    
                    <div className="pt-2 flex justify-between items-center">
                      <div className="text-gray-600">
                        Total Daily Points: {teamPointsForDate.reduce((sum, team) => sum + team.points, 0)}
                      </div>
                      <Link to="/activities/new">
                        <Button size="sm" variant="outline">
                          <Plus className="mr-1 h-4 w-4" /> Add Activity
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-800 mb-2">No team points for this date</h3>
                    <p className="text-gray-600 mb-4">Record activities to earn points for your team!</p>
                    <Link to="/activities/new">
                      <Button className="bg-movement-purple hover:bg-movement-dark-purple">
                        <Plus className="mr-2 h-4 w-4" /> Log Activity
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
