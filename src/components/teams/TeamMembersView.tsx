
import { Team, Participant } from "@/types";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface TeamMembersViewProps {
  selectedTeam: (Team & {
    totalPoints?: number;
    totalMinutes?: number;
    memberCount?: number;
    members?: Participant[];
  }) | null;
  teamMembers: Participant[];
  isViewMembersOpen: boolean;
  setIsViewMembersOpen: (isOpen: boolean) => void;
  isMobile: boolean;
}

const TeamMembersView = ({
  selectedTeam,
  teamMembers,
  isViewMembersOpen,
  setIsViewMembersOpen,
  isMobile
}: TeamMembersViewProps) => {
  if (!selectedTeam) return null;
  
  const ViewMembersContent = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-gray-600 mb-2">Team Members</h3>
        {teamMembers.length === 0 ? (
          <p className="text-sm text-gray-500">No members in this team yet</p>
        ) : (
          <div className="space-y-2">
            {teamMembers.map(participant => (
              <div 
                key={participant.id} 
                className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
              >
                <div>
                  <p className="font-medium">{participant.name}</p>
                  <p className="text-xs text-gray-600">{participant.points} pts • {participant.totalMinutes} min</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
  
  return isMobile ? (
    <Drawer open={isViewMembersOpen} onOpenChange={setIsViewMembersOpen}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{selectedTeam.name} Team Members</DrawerTitle>
          <DrawerDescription>View all team members</DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-4">
          <ViewMembersContent />
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline" className="w-full">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ) : (
    <Sheet open={isViewMembersOpen} onOpenChange={setIsViewMembersOpen}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{selectedTeam.name} Team Members</SheetTitle>
          <SheetDescription>View all team members</SheetDescription>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          <ViewMembersContent />
        </div>
        <div className="absolute bottom-6 right-6 left-6">
          <Button variant="outline" className="w-full" onClick={() => setIsViewMembersOpen(false)}>
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default TeamMembersView;
