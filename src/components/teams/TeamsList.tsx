
import { Team, Participant } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Trophy, Trash2 } from "lucide-react";
import { EditTeamDialog } from "@/components/EditTeamDialog";
import EmptyTeamState from "./EmptyTeamState";

interface TeamsListProps {
  teams: Array<Team & {
    totalPoints: number;
    totalMinutes: number;
    memberCount: number;
    members: Participant[];
  }>;
  handleDeleteTeam: (teamId: string) => void;
  handleUpdateTeam: (teamId: string, name: string, color: string) => void;
  setSelectedTeam: (team: Team & {
    totalPoints: number;
    totalMinutes: number;
    memberCount: number;
    members: Participant[];
  }) => void;
  setIsViewMembersOpen: (isOpen: boolean) => void;
  allTeams: Team[];
}

const TeamsList = ({ 
  teams, 
  handleDeleteTeam, 
  handleUpdateTeam,
  setSelectedTeam,
  setIsViewMembersOpen,
  allTeams
}: TeamsListProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {teams.map((team, index) => (
        <Card key={team.id} className="overflow-hidden">
          <div className="h-2" style={{ backgroundColor: team.color }} />
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {index === 0 && teams.length > 1 && (
                  <span className="inline-flex items-center justify-center rounded-full bg-yellow-100 w-6 h-6">
                    <Trophy className="h-3 w-3 text-yellow-600" />
                  </span>
                )}
                <CardTitle>{team.name}</CardTitle>
              </div>
              <div className="flex gap-2">
                <EditTeamDialog team={team} onUpdate={handleUpdateTeam} teams={allTeams} />
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
              {team.memberCount} {team.memberCount === 1 ? "member" : "members"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold" style={{ color: team.color }}>
                    {team.totalPoints}
                  </div>
                  <div className="text-sm text-gray-600">
                    Total Points
                  </div>
                </div>
                <div className="flex-1 bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold" style={{ color: team.color }}>
                    {team.totalMinutes}
                  </div>
                  <div className="text-sm text-gray-600">
                    Total Minutes
                  </div>
                </div>
              </div>
              
              {team.members.length > 0 ? (
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Team Members</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                    {team.members.map(member => (
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
                setIsViewMembersOpen(true);
              }}
            >
              <Users className="mr-2 h-4 w-4" />
              View Members
            </Button>
          </CardFooter>
        </Card>
      ))}
      
      {teams.length === 0 && (
        <div className="col-span-full">
          <EmptyTeamState onAddTeam={() => setIsViewMembersOpen(true)} />
        </div>
      )}
    </div>
  );
};

export default TeamsList;
