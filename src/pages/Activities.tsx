
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Activity } from "@/types";
import { getActivities, deleteActivity } from "@/lib/api/activities";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Calendar, Plus } from "lucide-react";
import { format } from "date-fns";

const Activities = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  useEffect(() => {
    const loadActivities = async () => {
      setIsLoading(true);
      try {
        const data = await getActivities();
        // Sort by date (newest first)
        const sortedData = [...data].sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setActivities(sortedData);
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
  
  const handleDelete = async (id: string) => {
    try {
      await deleteActivity(id);
      setActivities(activities.filter(a => a.id !== id));
      setDeleteId(null);
    } catch (error) {
      console.error("Error deleting activity:", error);
    }
  };
  
  // Group activities by date
  const activitiesByDate: Record<string, Activity[]> = {};
  activities.forEach(activity => {
    const date = activity.date;
    if (!activitiesByDate[date]) {
      activitiesByDate[date] = [];
    }
    activitiesByDate[date].push(activity);
  });
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Activities</h1>
          <p className="text-gray-600">View and manage all logged exercises</p>
        </div>
        <Link to="/activities/new">
          <Button className="bg-movement-purple hover:bg-movement-dark-purple">
            <Plus className="mr-2 h-4 w-4" /> Log Activity
          </Button>
        </Link>
      </div>
      
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-movement-purple border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Loading activities...</p>
        </div>
      ) : activities.length > 0 ? (
        <div className="space-y-6">
          {Object.entries(activitiesByDate).map(([date, dateActivities]) => (
            <Card key={date}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-movement-purple" />
                  <CardTitle className="text-lg">
                    {format(new Date(date), 'MMMM d, yyyy')}
                  </CardTitle>
                </div>
                <CardDescription>
                  {dateActivities.length} {dateActivities.length === 1 ? 'activity' : 'activities'} logged
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dateActivities.map(activity => (
                    <div 
                      key={activity.id} 
                      className="p-3 rounded-lg bg-gray-50 flex justify-between items-start"
                    >
                      <div>
                        <div className="font-medium">{activity.type}</div>
                        <div className="text-sm text-gray-600">
                          {activity.participantName} • {activity.minutes} min • {activity.points} points
                        </div>
                        {activity.notes && (
                          <div className="text-sm text-gray-600 mt-1">{activity.notes}</div>
                        )}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setDeleteId(activity.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-gray-50 border-dashed">
          <CardContent className="pt-6 text-center">
            <div className="rounded-full bg-movement-light-purple w-12 h-12 flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-6 w-6 text-movement-purple" />
            </div>
            <h3 className="text-lg font-medium mb-2">No activities yet</h3>
            <p className="text-gray-600 mb-4">Start tracking your exercise to earn points!</p>
            <Link to="/activities/new">
              <Button className="bg-movement-purple hover:bg-movement-dark-purple">
                <Plus className="mr-2 h-4 w-4" /> Log Your First Activity
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
      
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this activity and reduce the participant's points. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-500 hover:bg-red-600"
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Activities;
