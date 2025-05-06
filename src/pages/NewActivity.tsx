
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
import { toast } from "@/components/ui/sonner";
import { validateField, ValidationError } from "@/utils/formValidation";
import { Skeleton } from "@/components/ui/skeleton";

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
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [formData, setFormData] = useState({
    participantId: "",
    type: "",
    minutes: "",
    date: new Date().toISOString().split("T")[0],
    notes: ""
  });
  
  const [errors, setErrors] = useState<Record<string, ValidationError>>({
    participantId: null,
    type: null,
    minutes: null,
    date: null
  });

  // Load participants data
  useState(() => {
    try {
      const data = getParticipants();
      setParticipants(data);
    } catch (error) {
      toast.error("Failed to load participants. Please try again.");
      console.error("Error loading participants:", error);
    } finally {
      setIsLoading(false);
    }
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Validate the field as user types
    if (name === 'minutes') {
      const validationError = validateField(value, { 
        required: true, 
        min: 1 
      }, 'duration');
      setErrors(prev => ({ ...prev, [name]: validationError }));
    } else if (name === 'date') {
      const validationError = validateField(value, { required: true }, 'date');
      setErrors(prev => ({ ...prev, [name]: validationError }));
    }
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Validate the field when selection changes
    if (name === 'participantId') {
      const validationError = validateField(value, { required: true }, 'participant');
      setErrors(prev => ({ ...prev, [name]: validationError }));
    } else if (name === 'type') {
      const validationError = validateField(value, { required: true }, 'activity type');
      setErrors(prev => ({ ...prev, [name]: validationError }));
    }
  };
  
  const validateForm = (): boolean => {
    const newErrors = {
      participantId: validateField(formData.participantId, { required: true }, 'participant'),
      type: validateField(formData.type, { required: true }, 'activity type'),
      minutes: validateField(formData.minutes, { required: true, min: 1 }, 'duration'),
      date: validateField(formData.date, { required: true }, 'date')
    };
    
    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== null);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all form fields
    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Find participant's name
      const participant = participants.find(p => p.id === formData.participantId);
      if (!participant) {
        toast.error("Invalid participant selected");
        return;
      }
      
      // Parse minutes as integer
      const minutes = parseInt(formData.minutes);
      
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
      
      toast.success("Activity logged successfully!");
      
      // Navigate back to activities list
      navigate("/activities");
    } catch (error) {
      console.error("Error saving activity:", error);
      toast.error("Failed to save activity. Please try again.");
    } finally {
      setIsSaving(false);
    }
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
          {isLoading ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="participant">Participant</Label>
                <Select 
                  value={formData.participantId} 
                  onValueChange={(value) => handleSelectChange("participantId", value)}
                  disabled={isSaving}
                >
                  <SelectTrigger id="participant" className={errors.participantId ? "border-red-500" : ""}>
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
                {errors.participantId && (
                  <p className="text-sm text-red-500 mt-1">{errors.participantId}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Activity Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => handleSelectChange("type", value)}
                  disabled={isSaving}
                >
                  <SelectTrigger id="type" className={errors.type ? "border-red-500" : ""}>
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
                {errors.type && (
                  <p className="text-sm text-red-500 mt-1">{errors.type}</p>
                )}
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
                  className={errors.minutes ? "border-red-500" : ""}
                  disabled={isSaving}
                />
                {errors.minutes ? (
                  <p className="text-sm text-red-500 mt-1">{errors.minutes}</p>
                ) : (
                  <p className="text-sm text-gray-500">
                    Every 15 minutes = 1 point
                  </p>
                )}
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
                  className={errors.date ? "border-red-500" : ""}
                  disabled={isSaving}
                />
                {errors.date && (
                  <p className="text-sm text-red-500 mt-1">{errors.date}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Any additional details about your activity"
                  value={formData.notes}
                  onChange={handleChange}
                  disabled={isSaving}
                />
              </div>
              
              <div className="flex gap-4 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate("/activities")}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="bg-movement-purple hover:bg-movement-dark-purple flex-1"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></span>
                      Saving...
                    </>
                  ) : (
                    "Log Activity"
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NewActivity;
