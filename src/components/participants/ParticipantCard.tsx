import { Participant, Activity, Team } from "@/types";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, ActivityIcon, Users, Trophy } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { isOwningUser } from "@/lib/local-storage";

interface ParticipantCardProps {
  participant: Participant;
  activities: Activity[];
  team: Team | null;
  onTeamChange: (participant: Participant) => void;
}

const ParticipantCard = ({ participant, activities, team, onTeamChange }: ParticipantCardProps) => {
  const { user } = useAuth();
  // Sort activities by date (newest first) before rendering
  const sortedActivities = [...activities].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  // Helper function to format date in a user-friendly way
  const formatActivityDate = (dateString: string): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for comparison
    
    // Create a date object that respects the exact date from the string without timezone adjustments
    const activityDate = new Date(dateString + 'T00:00:00');
    
    // Check if date is today
    if (activityDate.toDateString() === today.toDateString()) {
      return "Today";
    }
    
    // Check if date is yesterday
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (activityDate.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }
    
    // Otherwise return the date in localized format
    return activityDate.toLocaleDateString(undefined, { 
      year: 'numeric',
      month: 'short', 
      day: 'numeric'
    });
  };

  // Get activities from the last 3 days (including today)
  const getRecentActivities = () => {
    const now = new Date();
    
    // Set today to the start of the day (midnight)
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    // Calculate two days ago from now
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    // Filter activities within the last 3 days
    const filteredActivities = sortedActivities.filter(activity => {
      // Create a date object that respects the exact date from the string without timezone adjustments
      const activityDate = new Date(activity.date + 'T00:00:00');
      
      // Include the activity if it's from today or up to 2 days ago
      return activityDate.getTime() >= twoDaysAgo.getTime();
    });
    
    return filteredActivities;
  };
  
  // Get recent activities (last 3 days including today)
  const recentActivities = getRecentActivities();

  return (
    <Card key={participant.id} className="overflow-hidden">
      {team ? (
        <div className="h-2" style={{ backgroundColor: team.color }} />
      ) : (
        <div className="h-2 bg-gradient-to-r from-movement-purple to-movement-dark-purple" />
      )}
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>{participant.name}</span>
          <div className="flex items-center gap-1 text-yellow-500">
            <Trophy className="h-5 w-5" />
            <span>{participant.points} pts</span>
          </div>
        </CardTitle>
        {team && (
          <div className="text-sm text-gray-600 flex items-center gap-1 mt-1">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: team.color }}
            ></div>
            Team: {team.name}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-movement-purple">
                {participant.totalMinutes}
              </div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <Clock className="h-4 w-4" /> Minutes
              </div>
            </div>
            <div className="flex-1 bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-movement-purple">
                {activities.length}
              </div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <ActivityIcon className="h-4 w-4" /> Activities
              </div>
            </div>
          </div>
          {isOwningUser(participant.id, user.id) &&
        
          <div className="flex justify-between items-center">
            <Button
              variant="outline" 
              size="sm"
              className="w-full"
              onClick={() => onTeamChange(participant)}
            >
              <Users className="mr-2 h-4 w-4" />
              {participant.teamId ? "Change Team" : "Assign to Team"}
            </Button>
          </div>
          }
          
          {recentActivities.length > 0 ? (
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2 ">Recent Activities (Last 3 Days)</h3>
              <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                {recentActivities.map(activity => (
                  <div key={activity.id} className="bg-gray-50 p-2 rounded text-sm">
                    <div className="flex justify-between font-medium">
                      <span>{activity.type}</span>
                      <span className="text-movement-purple">+{activity.points} pts</span>
                    </div>
                    <div className="text-gray-600 text-xs">
                      {activity.minutes} min • {formatActivityDate(activity.date)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 text-sm py-2">
              No activities in the last 3 days
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ParticipantCard;
