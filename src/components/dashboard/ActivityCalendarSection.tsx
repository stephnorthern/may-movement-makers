
import { useState } from "react";
import { Link } from "react-router-dom";
import { Activity } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, UserRound } from "lucide-react";
import { format } from "date-fns";

interface ActivityCalendarSectionProps {
  activities: Activity[];
}

const ActivityCalendarSection = ({ activities }: ActivityCalendarSectionProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Get activities for the selected date
  const activitiesForDate = selectedDate 
    ? activities.filter(activity => activity.date === selectedDate.toISOString().split('T')[0]) 
    : [];

  return (
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
  );
};

export default ActivityCalendarSection;
