
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";

interface EmptyParticipantsListProps {
  onAddParticipant: () => void;
}

const EmptyParticipantsList = ({ onAddParticipant }: EmptyParticipantsListProps) => {
  return (
    <div className="col-span-full">
      <Card className="bg-gray-50 border-dashed">
        <CardContent className="pt-6 text-center">
          <div className="rounded-full bg-movement-light-green w-12 h-12 flex items-center justify-center mx-auto mb-4">
            <Users className="h-6 w-6 text-movement-green" />
          </div>
          <h3 className="text-lg font-medium mb-2">No participants yet</h3>
          <p className="text-gray-600 mb-4">Add participants to start tracking their progress</p>
          <Button 
            className="bg-movement-green hover:bg-movement-dark-green"
            onClick={onAddParticipant}
          >
            <Plus className="mr-2 h-4 w-4" /> Add First Participant
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmptyParticipantsList;
