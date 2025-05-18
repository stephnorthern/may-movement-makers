
import { useState } from "react";
import { Team } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { addParticipant } from "@/lib/api/participants";

interface AddParticipantDialogProps {
  teams: Team[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const AddParticipantDialog = ({ teams, isOpen, onOpenChange, onSuccess }: AddParticipantDialogProps) => {
  const [newParticipantName, setNewParticipantName] = useState("");
  const [newParticipantTeamId, setNewParticipantTeamId] = useState<string>("");

  const handleAddParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newParticipantName.trim()) {
      toast.error("Please enter a name");
      return;
    }
    
    addParticipant("1234",{ 
      name: newParticipantName.trim(),
      teamId: newParticipantTeamId && newParticipantTeamId !== "none" ? newParticipantTeamId : undefined
    });
    
    setNewParticipantName("");
    setNewParticipantTeamId("");
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Participant</DialogTitle>
          <DialogDescription>
            Enter the name of the new participant joining the May Movement challenge.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleAddParticipant}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Enter participant name"
                value={newParticipantName}
                onChange={(e) => setNewParticipantName(e.target.value)}
              />
            </div>
            {teams.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="team">Team (Optional)</Label>
                <Select 
                  value={newParticipantTeamId} 
                  onValueChange={setNewParticipantTeamId}
                >
                  <SelectTrigger id="team">
                    <SelectValue placeholder="Select a team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Team</SelectItem>
                    {teams.map(team => (
                      <SelectItem key={team.id} value={team.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: team.color }}
                          ></div>
                          {team.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-movement-purple hover:bg-movement-dark-purple">
              Add Participant
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddParticipantDialog;
