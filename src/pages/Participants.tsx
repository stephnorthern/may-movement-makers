
import { useEffect, useState } from "react";
import { Participant, Team, Activity } from "@/types";
import { getParticipants, getParticipantActivities, addParticipant, getTeams, assignParticipantToTeam } from "@/lib/local-storage";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trophy, Activity as ActivityIcon, Clock, Users } from "lucide-react";
import { toast } from "sonner";

const Participants = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [participantActivities, setParticipantActivities] = useState<Record<string, Activity[]>>({});
  const [newParticipantName, setNewParticipantName] = useState("");
  const [newParticipantTeamId, setNewParticipantTeamId] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const loadData = async () => {
    setIsLoading(true);
    try {
      const participantsData = getParticipants();
      const teamsData = getTeams();
      
      // Sort by points (highest first)
      const sortedData = [...participantsData].sort((a, b) => b.points - a.points);
      setParticipants(sortedData);
      setTeams(teamsData);
      
      // Load activities for each participant
      const activitiesMap: Record<string, Activity[]> = {};
      for (const participant of participantsData) {
        const activities = await getParticipantActivities(participant.id);
        activitiesMap[participant.id] = activities;
      }
      setParticipantActivities(activitiesMap);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
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
  
  const handleAddParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newParticipantName.trim()) {
      toast.error("Please enter a name");
      return;
    }
    
    // Check for duplicate names
    if (participants.some(p => p.name.toLowerCase() === newParticipantName.trim().toLowerCase())) {
      toast.error("A participant with this name already exists");
      return;
    }
    
    addParticipant({ 
      name: newParticipantName.trim(),
      teamId: newParticipantTeamId || undefined
    });
    setNewParticipantName("");
    setNewParticipantTeamId("");
    setIsDialogOpen(false);
    loadData();
  };
  
  const handleTeamChange = (participantId: string, teamId: string | null) => {
    assignParticipantToTeam(participantId, teamId);
    setIsTeamDialogOpen(false);
    setSelectedParticipant(null);
    loadData();
  };
  
  const getTeamById = (teamId?: string) => {
    if (!teamId) return null;
    return teams.find(team => team.id === teamId) || null;
  };
  
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-movement-purple border-t-transparent"></div>
        <p className="mt-2 text-gray-600">Loading participants...</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Participants</h1>
          <p className="text-gray-600">View and manage all challenge participants</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-movement-purple hover:bg-movement-dark-purple">
              <Plus className="mr-2 h-4 w-4" /> Add Participant
            </Button>
          </DialogTrigger>
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
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-movement-purple hover:bg-movement-dark-purple">
                  Add Participant
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {participants.map((participant) => {
          const activities = participantActivities[participant.id] || [];
          const team = getTeamById(participant.teamId);
          
          return (
            <Card key={participant.id} className="overflow-hidden">
              {team ? (
                <div className="h-2" style={{ backgroundColor: team.color }} />
              ) : (
                <div className="h-2 bg-gradient-to-r from-movement-purple to-movement-dark-purple" />
              )}
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{participant.name}</span>
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Trophy className="h-5 w-5" />
                    <span>{participant.points} pts</span>
                  </div>
                </CardTitle>
                {team && (
                  <div className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: team.color }}
                    ></div>
                    Team: {team.name}
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1 bg-gray-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-movement-purple">
                        {participant.totalMinutes}
                      </div>
                      <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                        <Clock className="h-4 w-4" /> Minutes
                      </div>
                    </div>
                    <div className="flex-1 bg-gray-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-movement-purple">
                        {activities.length}
                      </div>
                      <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                        <ActivityIcon className="h-4 w-4" /> Activities
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <Button
                      variant="outline" 
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setSelectedParticipant(participant);
                        setIsTeamDialogOpen(true);
                      }}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      {participant.teamId ? "Change Team" : "Assign to Team"}
                    </Button>
                  </div>
                  
                  {activities.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-600 mb-2">Recent Activities</h3>
                      <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                        {activities
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .slice(0, 3)
                          .map(activity => (
                            <div key={activity.id} className="bg-gray-50 p-2 rounded text-sm">
                              <div className="flex justify-between font-medium">
                                <span>{activity.type}</span>
                                <span className="text-movement-purple">+{activity.points} pts</span>
                              </div>
                              <div className="text-gray-600 text-xs">
                                {activity.minutes} min • {new Date(activity.date).toLocaleDateString()}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
        
        {participants.length === 0 && (
          <div className="col-span-full">
            <Card className="bg-gray-50 border-dashed">
              <CardContent className="pt-6 text-center">
                <div className="rounded-full bg-movement-light-purple w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <Users className="h-6 w-6 text-movement-purple" />
                </div>
                <h3 className="text-lg font-medium mb-2">No participants yet</h3>
                <p className="text-gray-600 mb-4">Add participants to start tracking their progress</p>
                <Button 
                  className="bg-movement-purple hover:bg-movement-dark-purple"
                  onClick={() => setIsDialogOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add First Participant
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      
      {/* Team Assignment Dialog */}
      <Dialog open={isTeamDialogOpen} onOpenChange={setIsTeamDialogOpen}>
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
            <Button type="button" variant="outline" onClick={() => setIsTeamDialogOpen(false)}>
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
    </div>
  );
};

export default Participants;
