
import { useEffect, useState } from "react";
import { Team, Participant } from "@/types";
import { getTeams, getParticipants, addTeam, updateTeam, deleteTeam } from "@/lib/local-storage";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import TeamsList from "@/components/teams/TeamsList";
import EmptyTeamState from "@/components/teams/EmptyTeamState";
import TeamMembersView from "@/components/teams/TeamMembersView";
import AddTeamDialog from "@/components/teams/AddTeamDialog";

const Teams = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isAddTeamDialogOpen, setIsAddTeamDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team & {
    totalPoints: number;
    totalMinutes: number;
    memberCount: number;
    members: Participant[];
  } | null>(null);
  const [isViewMembersOpen, setIsViewMembersOpen] = useState(false);
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

  const handleAddTeam = (name: string, color: string) => {
    addTeam({
      name,
      color
    });
    loadData();
  };

  const handleDeleteTeam = (teamId: string) => {
    if (confirm("Are you sure you want to delete this team? All members will be removed from the team.")) {
      deleteTeam(teamId);
      loadData();
    }
  };

  const handleUpdateTeam = (teamId: string, name: string, color: string) => {
    updateTeam(teamId, {
      name,
      color
    });
    loadData();
  };

  const teamMembers = (teamId: string) => {
    return participants.filter(p => p.teamId === teamId);
  };

  // Calculate team totals and sort by points
  const teamsWithTotals = teams.map(team => {
    const members = teamMembers(team.id);
    const totalTeamPoints = members.reduce((sum, member) => sum + member.points, 0);
    const totalTeamMinutes = members.reduce((sum, member) => sum + member.totalMinutes, 0);
    return {
      ...team,
      totalPoints: totalTeamPoints,
      totalMinutes: totalTeamMinutes,
      memberCount: members.length,
      members
    };
  }).sort((a, b) => b.totalPoints - a.totalPoints); // Sort by total points (descending)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Teams</h1>
          <p className="text-gray-600">Manage teams and their members</p>
        </div>
        <AddTeamDialog 
          onAddTeam={handleAddTeam}
          teams={teams}
        />
      </div>
      
      <TeamsList 
        teams={teamsWithTotals} 
        handleDeleteTeam={handleDeleteTeam}
        handleUpdateTeam={handleUpdateTeam}
        setSelectedTeam={setSelectedTeam}
        setIsViewMembersOpen={setIsViewMembersOpen}
        allTeams={teams}
      />
      
      {selectedTeam && (
        <TeamMembersView
          selectedTeam={selectedTeam}
          teamMembers={teamMembers(selectedTeam.id)}
          isViewMembersOpen={isViewMembersOpen}
          setIsViewMembersOpen={setIsViewMembersOpen}
          isMobile={isMobile}
        />
      )}
    </div>
  );
};

export default Teams;
