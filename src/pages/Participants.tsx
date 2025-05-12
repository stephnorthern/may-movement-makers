
import { useState, useEffect } from "react";
import { Participant } from "@/types";
import { 
  Card, 
  CardContent
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCcw, AlertCircle } from "lucide-react";
import { useParticipants } from "@/hooks/useParticipants";
import ParticipantCard from "@/components/participants/ParticipantCard";
import EmptyParticipantsList from "@/components/participants/EmptyParticipantsList";
import AddParticipantDialog from "@/components/participants/AddParticipantDialog";
import TeamAssignmentDialog from "@/components/participants/TeamAssignmentDialog";
import LoadingIndicator from "@/components/dashboard/LoadingIndicator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const Participants = () => {
  const {
    participants,
    teams,
    participantActivities,
    isLoading,
    initialLoadAttempted,
    loadError,
    loadData,
    getTeamById,
    retryLoading
  } = useParticipants();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Flag to track if we've shown data at least once
  const hasShownData = participants.length > 0;
  const showEmptyState = !isLoading && initialLoadAttempted && participants.length === 0;

  const handleTeamDialogOpen = (participant: Participant) => {
    setSelectedParticipant(participant);
    setIsTeamDialogOpen(true);
  };
  
  const handleManualRefresh = async () => {
    try {
      setRefreshing(true);
      toast.info("Refreshing participant data...");
      
      // Use the retry loading function from the hook
      await retryLoading();
    } catch (error) {
      console.error("Manual refresh error:", error);
      toast.error("Failed to refresh data: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setRefreshing(false);
    }
  };
  
  // Debug information
  useEffect(() => {
    console.log("Participants page state:", {
      isLoading,
      initialLoadAttempted,
      participantsCount: participants.length,
      teamsCount: teams.length,
      hasError: !!loadError,
      hasParticipantActivities: Object.keys(participantActivities).length > 0
    });
    
    if (loadError) {
      console.error("Load error details:", loadError);
    }
    
    if (participants.length > 0) {
      console.log("First participant:", participants[0]);
    }
  }, [isLoading, initialLoadAttempted, participants, teams, loadError, participantActivities]);

  // Force a refresh on initial render
  useEffect(() => {
    // Small delay to allow component to mount fully
    const timer = setTimeout(() => {
      if (!hasShownData && !refreshing) {
        handleManualRefresh();
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Render initial loading state
  if (isLoading && !hasShownData) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Participants</h1>
            <p className="text-gray-600">View and manage all challenge participants</p>
          </div>
          
          <Button 
            variant="outline"
            onClick={handleManualRefresh}
            disabled={refreshing}
          >
            <RefreshCcw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>
        <div className="flex justify-center py-16">
          <LoadingIndicator error={loadError} retryFn={handleManualRefresh} />
        </div>
      </div>
    );
  }

  // Render error state if loading failed
  if (loadError && initialLoadAttempted && !hasShownData) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Participants</h1>
            <p className="text-gray-600">View and manage all challenge participants</p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleManualRefresh}
              disabled={refreshing}
            >
              <RefreshCcw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
            
            <Button 
              className="bg-movement-purple hover:bg-movement-dark-purple"
              onClick={() => setIsDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Participant
            </Button>
          </div>
        </div>
        
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertCircle className="h-6 w-6" />
              <h3 className="text-lg font-medium">Data Loading Error</h3>
            </div>
            <p className="mb-4">{loadError?.message || "We encountered a problem loading participant data. This could be due to connectivity issues or database problems."}</p>
            <Button 
              variant="outline" 
              className="border-red-300 hover:bg-red-100"
              onClick={handleManualRefresh}
            >
              <RefreshCcw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Try Again
            </Button>
          </CardContent>
        </Card>
        
        <AddParticipantDialog 
          teams={teams}
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSuccess={() => loadData(true)}
        />
      </div>
    );
  }

  // Render empty state if no data after attempted load
  if (showEmptyState && initialLoadAttempted && !isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Participants</h1>
            <p className="text-gray-600">View and manage all challenge participants</p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleManualRefresh}
              disabled={refreshing}
            >
              <RefreshCcw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            <Button 
              className="bg-movement-purple hover:bg-movement-dark-purple"
              onClick={() => setIsDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Participant
            </Button>
          </div>
        </div>
        
        <EmptyParticipantsList onAddParticipant={() => setIsDialogOpen(true)} />
        
        <AddParticipantDialog 
          teams={teams}
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSuccess={loadData}
        />
      </div>
    );
  }
  
  // Default render for participants list
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Participants</h1>
          <p className="text-gray-600">View and manage all challenge participants ({participants.length})</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleManualRefresh}
            disabled={refreshing}
          >
            <RefreshCcw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          
          <Button 
            className="bg-movement-purple hover:bg-movement-dark-purple"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Participant
          </Button>
        </div>
      </div>
      
      {/* Show a non-flashing loading message only when refreshing data */}
      {refreshing && hasShownData && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-md p-3 text-sm flex items-center opacity-80 fixed top-4 right-4 shadow-md z-50">
          <div className="mr-2 h-4 w-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></div>
          Refreshing data...
        </div>
      )}
      
      {/* Show loading indicator while refreshing but with data already displayed */}
      {isLoading && hasShownData && (
        <div className="mb-4 bg-blue-50 border border-blue-200 p-3 rounded-md">
          <div className="flex items-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-blue-100 rounded-full"></div>
            <span className="text-sm text-blue-800">Updating data...</span>
          </div>
        </div>
      )}
      
      {/* Show the participants grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {participants.length > 0 ? (
          participants.map((participant) => {
            const activities = participantActivities[participant.id] || [];
            const team = getTeamById(participant.teamId);
            
            return (
              <ParticipantCard
                key={participant.id}
                participant={participant}
                activities={activities}
                team={team}
                onTeamChange={handleTeamDialogOpen}
              />
            );
          })
        ) : isLoading ? (
          // Show skeleton loaders when loading
          Array.from({ length: 3 }).map((_, index) => (
            <Card key={`skeleton-${index}`} className="overflow-hidden">
              <div className="h-2 bg-gray-200" />
              <div className="p-6">
                <Skeleton className="h-8 w-3/4 mb-4" />
                <Skeleton className="h-4 w-1/2 mb-6" />
                <div className="flex gap-4 mb-6">
                  <Skeleton className="h-20 flex-1 rounded-lg" />
                  <Skeleton className="h-20 flex-1 rounded-lg" />
                </div>
                <Skeleton className="h-10 w-full mb-6" />
                <Skeleton className="h-4 w-2/3 mb-2" />
                <Skeleton className="h-16 w-full rounded-lg" />
              </div>
            </Card>
          ))
        ) : (
          <EmptyParticipantsList onAddParticipant={() => setIsDialogOpen(true)} />
        )}
      </div>
      
      {/* Dialogs */}
      <AddParticipantDialog 
        teams={teams}
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={() => loadData(true)}
      />
      
      <TeamAssignmentDialog 
        isOpen={isTeamDialogOpen}
        onOpenChange={setIsTeamDialogOpen}
        selectedParticipant={selectedParticipant}
        teams={teams}
        onSuccess={() => {
          loadData(true);
          setSelectedParticipant(null);
        }}
      />
    </div>
  );
};

export default Participants;
