import React, { createContext, useContext } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface DataLoadingContextType {
  isLoading: boolean;
  loadParticipantData: (forceFresh?: boolean) => Promise<void>;
  initialLoadAttempted: boolean;
}

const DataLoadingContext = createContext<DataLoadingContextType | null>(null);

export const DataLoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const isLoading = queryClient.isFetching() > 0;

  const loadParticipantData = async (forceFresh = false) => {
    if (forceFresh) {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['participants'] }),
        queryClient.invalidateQueries({ queryKey: ['teams'] }),
        queryClient.invalidateQueries({ queryKey: ['activities'] })
      ]);
    }
  };

  return (
    <DataLoadingContext.Provider value={{ 
      isLoading, 
      loadParticipantData,
      initialLoadAttempted: true 
    }}>
      {children}
    </DataLoadingContext.Provider>
  );
};

export const useDataLoading = () => {
  const context = useContext(DataLoadingContext);
  if (!context) {
    throw new Error('useDataLoading must be used within a DataLoadingProvider');
  }
  return context;
}; 