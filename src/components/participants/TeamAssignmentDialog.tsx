import { Participant, Team } from "@/types";
import { Button } from "@/components/ui/button";
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
import { assignParticipantToTeam } from "@/lib/api/participants";

interface TeamAssignmentDialogProps {
  teams: Team[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedParticipant: Participant | null;
  onSuccess: () => void;
}

const TeamAssignmentDialog = ({ 
  teams, 
  isOpen, 
  onOpenChange, 
  selectedParticipant, 
  onSuccess 
}: TeamAssignmentDialogProps) => {
  const handleTeamChange = (participantId: string, teamId: string | null) => {
    assignParticipantToTeam(participantId, teamId);
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Team</DialogTitle>
          <DialogDescription>
            {selectedParticipant?.name ? `Assign ${selectedParticipant.name} to a team` : "Assign participant to a team"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="select-team">Select Team</Label>
            <Select 
              value={selectedParticipant?.teamId || "none"} 
              onValueChange={(value) => handleTeamChange(selectedParticipant?.id || "", value === "none" ? null : value)}
            >
              <SelectTrigger id="select-team">
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
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {selectedParticipant?.teamId && (
            <Button 
              variant="destructive" 
              onClick={() => handleTeamChange(selectedParticipant?.id || "", null)}
            >
              Remove from Team
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TeamAssignmentDialog;
