
import { Button } from "@/components/ui/button";
import { Plus, RefreshCcw } from "lucide-react";

interface ParticipantsHeaderProps {
  participantsCount: number;
  onOpenAddDialog: () => void;
  onRefresh: () => void;
  refreshing: boolean;
}

const ParticipantsHeader = ({ 
  participantsCount, 
  onOpenAddDialog, 
  onRefresh, 
  refreshing 
}: ParticipantsHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold gradient-text">Participants</h1>
        <p className="text-gray-600">
          View and manage all challenge participants
          {participantsCount > 0 ? ` (${participantsCount})` : ''}
        </p>
      </div>
      
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={onRefresh}
          disabled={refreshing}
        >
          <RefreshCcw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>

      </div>
    </div>
  );
};

export default ParticipantsHeader;
