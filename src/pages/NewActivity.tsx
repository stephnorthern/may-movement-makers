
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Participant } from "@/types";
import { getParticipants, addActivity } from "@/lib/local-storage";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const ACTIVITY_TYPES = [
  "Running",
  "Walking",
  "Cycling",
  "Swimming",
  "Yoga",
  "HIIT",
  "Weight Training",
  "Pilates",
  "Dance",
  "Team Sports",
  "Other"
];

const NewActivity = () => {
  const navigate = useNavigate();
  const [participants] = useState<Participant[]>(getParticipants());
  const [formData, setFormData] = useState({
    participantId: "",
    type: "",
    minutes: "",
    date: new Date().toISOString().split("T")[0],
    notes: ""
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.participantId) {
      toast.error("Please select a participant");
      return;
    }
    
    if (!formData.type) {
      toast.error("Please select an activity type");
      return;
    }
    
    const minutes = parseInt(formData.minutes);
    if (isNaN(minutes) || minutes <= 0) {
      toast.error("Please enter a valid duration");
      return;
    }
    
    // Find participant's name
    const participant = participants.find(p => p.id === formData.participantId);
    if (!participant) {
      toast.error("Invalid participant selected");
      return;
    }
    
    // Add the activity
    addActivity({
      participantId: formData.participantId,
      participantName: participant.name,
      type: formData.type,
      minutes,
      date: formData.date,
      notes: formData.notes
    });
    
    // Dispatch an event to notify other components
    window.dispatchEvent(new Event("storage"));
    
    // Navigate back to activities list
    navigate("/activities");
  };
  
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold gradient-text mb-6">Log New Activity</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Activity Details</CardTitle>
          <CardDescription>Record your exercise to earn points</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="participant">Participant</Label>
              <Select 
                value={formData.participantId} 
                onValueChange={(value) => handleSelectChange("participantId", value)}
              >
                <SelectTrigger id="participant">
                  <SelectValue placeholder="Select participant" />
                </SelectTrigger>
                <SelectContent>
                  {participants.map(participant => (
                    <SelectItem key={participant.id} value={participant.id}>
                      {participant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Activity Type</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value) => handleSelectChange("type", value)}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select activity type" />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_TYPES.map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="minutes">Duration (minutes)</Label>
              <Input
                id="minutes"
                name="minutes"
                type="number"
                min="1"
                placeholder="How many minutes?"
                value={formData.minutes}
                onChange={handleChange}
              />
              <p className="text-sm text-gray-500">
                Every 15 minutes = 1 point
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                max={new Date().toISOString().split("T")[0]}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Any additional details about your activity"
                value={formData.notes}
                onChange={handleChange}
              />
            </div>
            
            <div className="flex gap-4 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate("/activities")}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="bg-movement-purple hover:bg-movement-dark-purple flex-1"
              >
                Log Activity
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewActivity;
