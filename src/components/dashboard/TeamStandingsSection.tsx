
import { useState } from "react";
import { Participant, Team } from "@/types";
import { useIsMobile } from "@/hooks/use-mobile";
import TeamsList from "@/components/teams/TeamsList";
import TeamMembersView from "@/components/teams/TeamMembersView";
import ChallengeHeader from "@/components/teams/ChallengeHeader";

interface TeamStandingsSectionProps {
  teams: Team[];
  participants: Participant[];
  loadData: () => void;
}

const TeamStandingsSection = ({ teams, participants, loadData }: TeamStandingsSectionProps) => {
  const [selectedTeam, setSelectedTeam] = useState<Team & {
    totalPoints: number;
    totalMinutes: number;
    memberCount: number;
    members: Participant[];
  } | null>(null);
  const [isViewMembersOpen, setIsViewMembersOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleAddTeam = (name: string, color: string) => {
    import("@/lib/api/teams").then(({ addTeam }) => {
      addTeam({
        name,
        color
      });
      loadData();
    });
  };

  const handleDeleteTeam = (teamId: string) => {
    if (confirm("Are you sure you want to delete this team? All members will be removed from the team.")) {
      import("@/lib/api/teams").then(({ deleteTeam }) => {
        deleteTeam(teamId);
        loadData();
      });
    }
  };

  const handleUpdateTeam = (teamId: string, name: string, color: string) => {
    import("@/lib/api/teams").then(({ updateTeam }) => {
      updateTeam(teamId, {
        name,
        color
      });
      loadData();
    });
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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Team Standings</h2>
          <p className="text-gray-600">Track team progress in the challenge</p>
        </div>
      </div>
      
      <ChallengeHeader hasTeams={teams.length > 0} />
      
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

export default TeamStandingsSection;
