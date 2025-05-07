
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface AddTeamDialogProps {
  onAddTeam: (name: string, color: string) => void;
  teams: { name: string }[];
  buttonLabel?: string;
}

const AddTeamDialog = ({ onAddTeam, teams, buttonLabel = "Add Team" }: AddTeamDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamColor, setNewTeamColor] = useState("#9b87f5");

  const handleAddTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) {
      toast.error("Please enter a team name");
      return;
    }

    // Check for duplicate names
    if (teams.some(t => t.name.toLowerCase() === newTeamName.trim().toLowerCase())) {
      toast.error("A team with this name already exists");
      return;
    }
    
    onAddTeam(newTeamName.trim(), newTeamColor);
    setNewTeamName("");
    setNewTeamColor("#9b87f5");
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-movement-purple hover:bg-movement-dark-purple">
          <Plus className="mr-2 h-4 w-4" /> {buttonLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Team</DialogTitle>
          <DialogDescription>
            Create a new team for the May Movement challenge.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleAddTeam}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Team Name</Label>
              <Input id="name" placeholder="Enter team name" value={newTeamName} onChange={e => setNewTeamName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Team Color</Label>
              <div className="flex gap-3">
                <Input id="color" type="color" value={newTeamColor} onChange={e => setNewTeamColor(e.target.value)} className="w-12 h-10 p-1" />
                <Input value={newTeamColor} onChange={e => setNewTeamColor(e.target.value)} placeholder="#HEX" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-movement-purple hover:bg-movement-dark-purple">
              Add Team
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTeamDialog;
