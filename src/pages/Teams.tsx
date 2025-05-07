import { useEffect, useState } from "react";
import { Team, Participant } from "@/types";
import { getTeams, getParticipants, addTeam, updateTeam, deleteTeam, assignParticipantToTeam } from "@/lib/local-storage";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
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
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Plus, Users, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { EditTeamDialog } from "@/components/EditTeamDialog";

const Teams = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamColor, setNewTeamColor] = useState("#9b87f5");
  const [isAddTeamDialogOpen, setIsAddTeamDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isManageMembersOpen, setIsManageMembersOpen] = useState(false);
  const isMobile = useIsMobile();
  
  const loadData = async () => {
    try {
      const teamsData = await getTeams();
      const participantsData = await getParticipants();
      setTeams(teamsData);
      setParticipants(participantsData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data");
    }
  };
  
  useEffect(() => {
    loadData();
    
    // Listen for storage changes
    const handleStorageChange = () => {
      loadData();
    };
    
    window.addEventListener("storage", handleStorageChange);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);
  
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
    
    addTeam({
      name: newTeamName.trim(),
      color: newTeamColor
    });
    
    setNewTeamName("");
    setNewTeamColor("#9b87f5");
    setIsAddTeamDialogOpen(false);
    loadData();
  };
  
  const handleDeleteTeam = (teamId: string) => {
    if (confirm("Are you sure you want to delete this team? All members will be removed from the team.")) {
      deleteTeam(teamId);
      loadData();
    }
  };
  
  const handleUpdateTeam = (teamId: string, name: string, color: string) => {
    updateTeam(teamId, { name, color });
    loadData();
  };
  
  const handleAssignToTeam = (participantId: string, teamId: string | null) => {
    assignParticipantToTeam(participantId, teamId);
    loadData();
  };
  
  const teamMembers = (teamId: string) => {
    return participants.filter(p => p.teamId === teamId);
  };
  
  const unassignedParticipants = () => {
    return participants.filter(p => !p.teamId);
  };
  
  const renderAddTeamDialog = () => {
    return (
      <Dialog open={isAddTeamDialogOpen} onOpenChange={setIsAddTeamDialogOpen}>
        <DialogTrigger asChild>
          <Button className="bg-movement-purple hover:bg-movement-dark-purple">
            <Plus className="mr-2 h-4 w-4" /> Add Team
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
                <Input
                  id="name"
                  placeholder="Enter team name"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Team Color</Label>
                <div className="flex gap-3">
                  <Input
                    id="color"
                    type="color"
                    value={newTeamColor}
                    onChange={(e) => setNewTeamColor(e.target.value)}
                    className="w-12 h-10 p-1"
                  />
                  <Input 
                    value={newTeamColor}
                    onChange={(e) => setNewTeamColor(e.target.value)}
                    placeholder="#HEX"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddTeamDialogOpen(false)}>
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
  
  const ManageMembers = () => {
    if (!selectedTeam) return null;
    
    const teamParticipants = teamMembers(selectedTeam.id);
    const unassigned = unassignedParticipants();
    
    const ManageMembersContent = () => (
      <>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Current Team Members</h3>
            {teamParticipants.length === 0 ? (
              <p className="text-sm text-gray-500">No members in this team yet</p>
            ) : (
              <div className="space-y-2">
                {teamParticipants.map(participant => (
                  <div key={participant.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                    <div>
                      <p className="font-medium">{participant.name}</p>
                      <p className="text-xs text-gray-600">{participant.points} pts • {participant.totalMinutes} min</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleAssignToTeam(participant.id, null)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {unassigned.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Available Participants</h3>
              <div className="space-y-2">
                {unassigned.map(participant => (
                  <div key={participant.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                    <p className="font-medium">{participant.name}</p>
                    <Button 
                      size="sm" 
                      className="bg-movement-purple hover:bg-movement-dark-purple"
                      onClick={() => handleAssignToTeam(participant.id, selectedTeam.id)}
                    >
                      Add to Team
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </>
    );
    
    return isMobile ? (
      <Drawer open={isManageMembersOpen} onOpenChange={setIsManageMembersOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Manage {selectedTeam.name} Members</DrawerTitle>
            <DrawerDescription>Add or remove team members</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4">
            <ManageMembersContent />
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">Done</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    ) : (
      <Sheet open={isManageMembersOpen} onOpenChange={setIsManageMembersOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Manage {selectedTeam.name} Members</SheetTitle>
            <SheetDescription>Add or remove team members</SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <ManageMembersContent />
          </div>
          <div className="absolute bottom-6 right-6 left-6">
            <Button variant="outline" className="w-full" onClick={() => setIsManageMembersOpen(false)}>
              Done
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Teams</h1>
          <p className="text-gray-600">View and manage challenge teams</p>
        </div>
        {renderAddTeamDialog()}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => {
          const members = teamMembers(team.id);
          const totalTeamPoints = members.reduce((sum, member) => sum + member.points, 0);
          const totalTeamMinutes = members.reduce((sum, member) => sum + member.totalMinutes, 0);
          
          return (
            <Card key={team.id} className="overflow-hidden">
              <div className="h-2" style={{ backgroundColor: team.color }} />
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{team.name}</CardTitle>
                  <div className="flex gap-2">
                    <EditTeamDialog team={team} onUpdate={handleUpdateTeam} teams={teams} />
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => handleDeleteTeam(team.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  {members.length} {members.length === 1 ? "member" : "members"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1 bg-gray-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold" style={{ color: team.color }}>
                        {totalTeamPoints}
                      </div>
                      <div className="text-sm text-gray-600">
                        Total Points
                      </div>
                    </div>
                    <div className="flex-1 bg-gray-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold" style={{ color: team.color }}>
                        {totalTeamMinutes}
                      </div>
                      <div className="text-sm text-gray-600">
                        Total Minutes
                      </div>
                    </div>
                  </div>
                  
                  {members.length > 0 ? (
                    <div>
                      <h3 className="text-sm font-medium text-gray-600 mb-2">Team Members</h3>
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                        {members.map(member => (
                          <div key={member.id} className="bg-gray-50 p-2 rounded text-sm">
                            <div className="flex justify-between font-medium">
                              <span>{member.name}</span>
                              <span style={{ color: team.color }}>{member.points} pts</span>
                            </div>
                            <div className="text-gray-600 text-xs">
                              {member.totalMinutes} minutes
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="rounded-full bg-gray-100 w-10 h-10 flex items-center justify-center mx-auto mb-2">
                        <Users className="h-5 w-5 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500">No members yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setSelectedTeam(team);
                    setIsManageMembersOpen(true);
                  }}
                >
                  Manage Members
                </Button>
              </CardFooter>
            </Card>
          );
        })}
        
        {teams.length === 0 && (
          <div className="col-span-full">
            <Card className="bg-gray-50 border-dashed">
              <CardContent className="pt-6 text-center">
                <div className="rounded-full bg-movement-light-purple w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <Users className="h-6 w-6 text-movement-purple" />
                </div>
                <h3 className="text-lg font-medium mb-2">No teams yet</h3>
                <p className="text-gray-600 mb-4">Create teams to group participants together</p>
                <Button 
                  className="bg-movement-purple hover:bg-movement-dark-purple"
                  onClick={() => setIsAddTeamDialogOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" /> Create First Team
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      
      {selectedTeam && <ManageMembers />}
    </div>
  );
};

export default Teams;
