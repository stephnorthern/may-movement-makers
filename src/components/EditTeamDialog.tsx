
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Edit } from "lucide-react";
import { toast } from "sonner";

interface EditTeamDialogProps {
  team: Team;
  onUpdate: (teamId: string, name: string, color: string) => void;
  teams: Team[];
}

export const EditTeamDialog = ({ team, onUpdate, teams }: EditTeamDialogProps) => {
  const [editName, setEditName] = useState(team.name);
  const [editColor, setEditColor] = useState(team.color);
  const [isOpen, setIsOpen] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      toast.error("Please enter a team name");
      return;
    }
    
    // Check for duplicate names, excluding current team
    if (teams.some(t => t.id !== team.id && t.name.toLowerCase() === editName.trim().toLowerCase())) {
      toast.error("A team with this name already exists");
      return;
    }
    
    onUpdate(team.id, editName.trim(), editColor);
    setIsOpen(false);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="h-8 w-8">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Team</DialogTitle>
          <DialogDescription>
            Update team information
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Team Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-color">Team Color</Label>
              <div className="flex gap-3">
                <Input
                  id="edit-color"
                  type="color"
                  value={editColor}
                  onChange={(e) => setEditColor(e.target.value)}
                  className="w-12 h-10 p-1"
                />
                <Input 
                  value={editColor}
                  onChange={(e) => setEditColor(e.target.value)}
                  placeholder="#HEX"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-movement-purple hover:bg-movement-dark-purple">
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
