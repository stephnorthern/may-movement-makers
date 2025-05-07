
import { Trophy } from "lucide-react";

interface ChallengeHeaderProps {
  hasTeams: boolean;
}

const ChallengeHeader = ({ hasTeams }: ChallengeHeaderProps) => {
  if (!hasTeams) return null;
  
  return (
    <div className="bg-gradient-to-r from-movement-green/10 to-movement-light-green/10 p-4 rounded-lg mb-4">
      <div className="flex items-center gap-2 mb-2">
        <Trophy className="h-5 w-5 text-movement-green" />
        <h2 className="font-semibold text-movement-green">Team Standings</h2>
      </div>
      <p className="text-sm text-gray-600">
        Teams are ranked by total points earned by all team members. View team details to see individual contributions.
      </p>
    </div>
  );
};

export default ChallengeHeader;
