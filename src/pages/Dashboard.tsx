
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Participant, Activity } from "@/types";
import { getParticipants, getActivities } from "@/lib/local-storage";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, Clock, Calendar, Plus, Activity as ActivityIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [stats, setStats] = useState({
    totalMinutes: 0,
    totalPoints: 0,
    totalActivities: 0
  });
  
  // Calculate days remaining
  const endDate = new Date("2025-06-02");
  const today = new Date();
  const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  useEffect(() => {
    // Load data
    const loadData = () => {
      const participantsData = getParticipants();
      const activitiesData = getActivities();
      
      setParticipants(participantsData);
      setActivities(activitiesData);
      
      // Calculate stats
      const totalMinutes = participantsData.reduce((sum, p) => sum + p.totalMinutes, 0);
      const totalPoints = participantsData.reduce((sum, p) => sum + p.points, 0);
      
      setStats({
        totalMinutes,
        totalPoints,
        totalActivities: activitiesData.length
      });
    };
    
    loadData();
    
    // Set up event listener for storage changes
    window.addEventListener('storage', loadData);
    
    return () => {
      window.removeEventListener('storage', loadData);
    };
  }, []);

  // Sort participants by points (descending)
  const rankedParticipants = [...participants].sort((a, b) => b.points - a.points);
  
  // Recent activities (last 5)
  const recentActivities = [...activities]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">May Movement Challenge</h1>
          <p className="text-gray-600 mt-1">Track exercise, earn points, win prizes!</p>
        </div>
        <Link to="/activities/new">
          <Button className="bg-movement-purple hover:bg-movement-dark-purple">
            <Plus className="mr-2 h-4 w-4" /> Log Activity
          </Button>
        </Link>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-movement-green border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-movement-purple" />
              Total Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{stats.totalPoints}</div>
            <p className="text-sm text-gray-600 mt-1">Across all participants</p>
          </CardContent>
        </Card>
        
        <Card className="bg-movement-light-purple border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-movement-purple" />
              Total Minutes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{stats.totalMinutes}</div>
            <p className="text-sm text-gray-600 mt-1">Of exercise logged</p>
          </CardContent>
        </Card>
        
        <Card className="bg-movement-yellow border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-movement-purple" />
              Challenge Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{daysRemaining}</div>
            <p className="text-sm text-gray-600 mt-1">Days remaining</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
          <CardDescription>Top participants by points</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rankedParticipants.map((participant, index) => (
              <div key={participant.id} className="flex items-center gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-movement-light-purple flex items-center justify-center font-semibold text-movement-purple">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">{participant.name}</span>
                    <span className="font-semibold">{participant.points} pts</span>
                  </div>
                  <Progress 
                    value={participant.points / (rankedParticipants[0]?.points || 1) * 100} 
                    className="h-2"
                  />
                </div>
              </div>
            ))}
            
            {participants.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                No participants yet. Add some to get started!
              </div>
            )}
            
            <div className="mt-4">
              <Link to="/participants">
                <Button variant="outline" className="w-full">View All Participants</Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
          <CardDescription>Latest logged exercises</CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivities.length > 0 ? (
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 p-3 rounded-lg bg-gray-50">
                  <div className="w-10 h-10 rounded-full bg-movement-purple/10 flex items-center justify-center text-movement-purple">
                    <ActivityIcon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">{activity.type}</p>
                        <p className="text-sm text-gray-600">{activity.participantName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-movement-purple">+{activity.points} pts</p>
                        <p className="text-sm text-gray-600">{activity.minutes} min</p>
                      </div>
                    </div>
                    {activity.notes && (
                      <p className="text-sm text-gray-600 mt-1">{activity.notes}</p>
                    )}
                  </div>
                </div>
              ))}
              
              <div className="mt-4">
                <Link to="/activities">
                  <Button variant="outline" className="w-full">View All Activities</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              No activities logged yet. Start moving!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
