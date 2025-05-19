import { useState, useEffect, useRef } from "react";
import { useParticipants } from "@/hooks/useParticipants";
import { useNavigationGuard } from "@/hooks/useNavigationGuard";

// Components
import LoadingIndicator from "@/components/dashboard/LoadingIndicator";
import AddParticipantDialog from "@/components/participants/AddParticipantDialog";
import TeamAssignmentDialog from "@/components/participants/TeamAssignmentDialog";
import ParticipantsHeader from "@/components/participants/ParticipantsHeader";
import ParticipantsGrid from "@/components/participants/ParticipantsGrid";
import RefreshingIndicator from "@/components/participants/RefreshingIndicator";
import ErrorDisplay from "@/components/participants/ErrorDisplay";
import { Participant } from "@/types";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const Participants = () => {
  const isMounted = useRef(true);
  const loadAttemptedRef = useRef(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  const {
    participants,
    teams,
    participantActivities,
    isLoading,
    initialLoadAttempted,
    loadError,
    loadData,
    getTeamById,
    retryLoading,
    refreshing,
    handleManualRefresh
  } = useParticipants();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [dataAvailable, setDataAvailable] = useState(false);
  
  // Flag to track if we've shown data at least once
  const hasShownData = participants.length > 0;
  const showEmptyState = !isLoading && initialLoadAttempted && participants.length === 0 && !loadError;
  
  // Use our navigation guard with relaxed criteria to prevent only during actual loading
  useNavigationGuard('/participants', (isLoading || refreshing) && !hasShownData);

  // Prevent component from unmounting during critical operations
  useEffect(() => {
    // Set mounted flag
    isMounted.current = true;
    
    // Ensure we stay on participants page during loading
    if (location.pathname === '/participants') {
      console.log("Mounted on participants page");
      
      // Flag that we're viewing this page
      sessionStorage.setItem('viewing_participants', 'true');
      
      // If we have never loaded data, try loading immediately
      if (!loadAttemptedRef.current) {
        console.log("Initial load on participants page");
        loadAttemptedRef.current = true;
        
        // Small delay to ensure proper rendering
        const timer = setTimeout(() => {
          if (isMounted.current) {
            handleManualRefresh();
          }
        }, 100);
        
        return () => clearTimeout(timer);
      }
    }
    
    return () => {
      // Only remove viewing flag if we're actually navigating away
      if (location.pathname !== '/participants') {
        console.log("Unmounting participants page, navigating to:", location.pathname);
        sessionStorage.removeItem('viewing_participants');
      }
      
      isMounted.current = false;
    };
  }, [location.pathname]);
  
  // Update data availability state
  useEffect(() => {
    if (participants.length > 0) {
      setDataAvailable(true);
    }
  }, [participants]);
  
  // Detect when data becomes available after loading
  useEffect(() => {
    if (dataAvailable && !isLoading && !refreshing) {
      console.log("Participants data successfully loaded:", participants.length, "participants");
    }
  }, [dataAvailable, isLoading, refreshing, participants.length]);

  // Add a fallback recovery mechanism
  useEffect(() => {
    if (loadError && !hasShownData && initialLoadAttempted) {
      console.log("Attempting recovery after load error");
      
      // Try loading from local storage as fallback
      const cachedData = localStorage.getItem('participants_cache');
      if (cachedData) {
        console.log("Found cached participant data, attempting to use it");
        
        // Force a refresh to use cached data
        const timer = setTimeout(() => {
          if (isMounted.current) {
            handleManualRefresh();
          }
        }, 1000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [loadError, hasShownData, initialLoadAttempted, handleManualRefresh]);
  
  const handleTeamDialogOpen = (participant: Participant) => {
    setSelectedParticipant(participant);
    setIsTeamDialogOpen(true);
  };
  
  // Render initial loading state
  if (isLoading && !hasShownData) {
    return (
      <div className="space-y-6">
        <ParticipantsHeader 
          participantsCount={0}
          onOpenAddDialog={() => setIsDialogOpen(true)}
          onRefresh={handleManualRefresh}
          refreshing={refreshing}
        />
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
        <ParticipantsHeader 
          participantsCount={0}
          onOpenAddDialog={() => setIsDialogOpen(true)}
          onRefresh={handleManualRefresh}
          refreshing={refreshing}
        />
        
        <div className="flex justify-center">
          <Button
            onClick={handleManualRefresh}
            variant="outline"
            className="mb-4"
            disabled={refreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Try Again"}
          </Button>
        </div>
        
        <ErrorDisplay 
          error={loadError} 
          onRetry={handleManualRefresh}
          refreshing={refreshing}
        />
        
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
  if (showEmptyState) {
    return (
      <div className="space-y-6">
        <ParticipantsHeader 
          participantsCount={0}
          onOpenAddDialog={() => setIsDialogOpen(true)}
          onRefresh={handleManualRefresh}
          refreshing={refreshing}
        />
        
        <ParticipantsGrid
          participants={[]}
          participantActivities={participantActivities}
          getTeamById={getTeamById}
          isLoading={false}
          onTeamChange={handleTeamDialogOpen}
          onAddParticipant={() => setIsDialogOpen(true)}
        />
        
        <AddParticipantDialog 
          teams={teams}
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSuccess={() => loadData(true)}
        />
      </div>
    );
  }
  
  // Default render for participants list
  return (
    <div className="space-y-6">
      <ParticipantsHeader 
        participantsCount={participants.length}
        onOpenAddDialog={() => setIsDialogOpen(true)}
        onRefresh={handleManualRefresh}
        refreshing={refreshing}
      />
      
      <RefreshingIndicator refreshing={refreshing} hasData={hasShownData} />
      
      <ParticipantsGrid
        participants={participants}
        participantActivities={participantActivities}
        getTeamById={getTeamById}
        isLoading={isLoading}
        onTeamChange={handleTeamDialogOpen}
        onAddParticipant={() => setIsDialogOpen(true)}
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
