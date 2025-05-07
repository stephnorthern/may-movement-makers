
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, Participant, Team } from "@/types";
import { getActivities } from "@/lib/api/activities";
import { getParticipants } from "@/lib/api/participants";
import { getTeams } from "@/lib/api/teams";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Users, Plus } from "lucide-react";
import { format } from "date-fns";

const Dashboard = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  useEffect(() => {
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
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold gradient-text">May Movement Challenge</h1>
        <p className="text-gray-600">Track your progress and stay motivated!</p>
      </div>
      
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-movement-purple border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Loading data...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Leaderboard Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Leaderboard</CardTitle>
                <Link to="/participants">
                  <Button variant="ghost" size="sm">
                    <Users className="mr-2 h-4 w-4" /> View All
                  </Button>
                </Link>
              </div>
              <CardDescription>Top participants this month</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {participants.length > 0 ? (
                participants.slice(0, 3).map(participant => (
                  <div key={participant.id} className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{participant.name}</div>
                      <div className="text-sm text-gray-500">
                        {participant.totalMinutes} minutes
                      </div>
                    </div>
                    <div className="font-bold text-movement-purple">
                      {participant.points} points
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-2">No participants yet</h3>
                  <p className="text-gray-600 mb-4">Add participants to start the challenge!</p>
                  <Link to="/participants">
                    <Button className="bg-movement-purple hover:bg-movement-dark-purple">
                      <Plus className="mr-2 h-4 w-4" /> Add Participants
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Activity Calendar Card */}
          <Card>
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
                <div className="mt-4">
                  <h4 className="font-semibold">
                    Activities for {format(selectedDate, 'MMMM d, yyyy')}
                  </h4>
                  {activitiesForDate.length > 0 ? (
                    <ul className="list-disc pl-5 mt-2">
                      {activitiesForDate.map(activity => (
                        <li key={activity.id}>
                          {activity.type} - {activity.minutes} minutes
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
      )}
    </div>
  );
};

export default Dashboard;
