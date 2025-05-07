
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { addActivity } from "@/lib/api/activities";
import { getParticipants } from "@/lib/api/participants";
import { validateField, ValidationError } from "@/utils/formValidation";
import { Participant } from "@/types";
import { useNavigate } from "react-router-dom";

export interface ActivityFormData {
  participantId: string;
  type: string;
  minutes: string;
  date: string;
  notes: string;
}

export function useActivityForm() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  
  // Use the current date but ensure we're using local timezone
  const today = new Date();
  const localDate = today.toLocaleDateString('en-CA'); // Format as YYYY-MM-DD
  
  const [formData, setFormData] = useState<ActivityFormData>({
    participantId: "",
    type: "",
    minutes: "",
    date: localDate,
    notes: ""
  });
  
  const [errors, setErrors] = useState<Record<string, ValidationError>>({
    participantId: null,
    type: null,
    minutes: null,
    date: null
  });
  
  // Load participants data
  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        setIsLoading(true);
        const data = await getParticipants();
        setParticipants(data);
      } catch (error) {
        toast.error("Failed to load participants. Please try again.");
        console.error("Error loading participants:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchParticipants();
  }, []);
  
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
      
      // Use the date as is without any timezone adjustments
      // This fixes the issue where activities were getting assigned to the day before
      
      // Add the activity
      await addActivity({
        participantId: formData.participantId,
        participantName: participant.name,
        type: formData.type,
        minutes,
        date: formData.date,
        notes: formData.notes
      });
      
      // Navigate back to activities list
      navigate("/activities");
    } catch (error) {
      console.error("Error saving activity:", error);
      toast.error("Failed to save activity. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isLoading,
    isSaving,
    participants,
    formData,
    errors,
    handleChange,
    handleSelectChange,
    handleSubmit,
    navigate
  };
}
