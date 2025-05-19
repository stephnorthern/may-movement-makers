
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
import { ACTIVITY_TYPES } from "@/constants/activities";
import { ActivityFormData } from "@/hooks/useActivityForm";
import { Participant } from "@/types";
import { ValidationError } from "@/utils/formValidation";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ActivityFormProps {
  formData: ActivityFormData;
  errors: Record<string, ValidationError>;
  isSaving: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onSelectChange: (name: string, value: string) => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export const ActivityForm = ({
  formData,
  errors,
  isSaving,
  onSubmit,
  onCancel,
  onSelectChange,
  onChange
}: ActivityFormProps) => {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
       <div className="space-y-2">
        <Label htmlFor="type">Activity Type</Label>
        <Select 
          value={formData.type} 
          onValueChange={(value) => onSelectChange("type", value)}
          disabled={isSaving}
        >
          <SelectTrigger id="type" className={errors.type ? "border-red-500" : ""}>
            <SelectValue placeholder="Select activity type" />
          </SelectTrigger>
          <SelectContent>
            <ScrollArea className="h-[200px]">
              {ACTIVITY_TYPES.map(type => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </ScrollArea>
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
          onChange={onChange}
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
          onChange={onChange}
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
          onChange={onChange}
          disabled={isSaving}
        />
      </div>
      
      <div className="flex gap-4 pt-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button 
          type="submit"
          className="bg-movement-green hover:bg-movement-dark-green flex-1"
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
  );
};
