
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";

interface EmptyTeamStateProps {
  onAddTeam: () => void;
}

const EmptyTeamState = ({ onAddTeam }: EmptyTeamStateProps) => {
  return (
    <Card className="bg-gray-50 border-dashed">
      <CardContent className="pt-6 text-center">
        <div className="rounded-full bg-movement-light-green w-12 h-12 flex items-center justify-center mx-auto mb-4">
          <Users className="h-6 w-6 text-movement-green" />
        </div>
        <h3 className="text-lg font-medium mb-2">No teams yet</h3>
        <p className="text-gray-600 mb-4">Create teams to group participants and track their collective progress</p>
        <Button 
          className="bg-movement-green hover:bg-movement-dark-green" 
          onClick={onAddTeam}
        >
          <Plus className="mr-2 h-4 w-4" /> Create First Team
        </Button>
      </CardContent>
    </Card>
  );
};

export default EmptyTeamState;
