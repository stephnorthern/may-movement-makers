
interface RefreshingIndicatorProps {
  refreshing: boolean;
  hasData: boolean;
}

const RefreshingIndicator = ({ refreshing, hasData }: RefreshingIndicatorProps) => {
  if (!refreshing || !hasData) {
    return null;
  }

  return (
    <>
      {/* Floating indicator for refresh in progress */}
      <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-md p-3 text-sm flex items-center opacity-80 fixed top-4 right-4 shadow-md z-50">
        <div className="mr-2 h-4 w-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></div>
        Refreshing data...
      </div>
      
      {/* Inline indicator */}
      <div className="mb-4 bg-blue-50 border border-blue-200 p-3 rounded-md">
        <div className="flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-blue-100 rounded-full"></div>
          <span className="text-sm text-blue-800">Updating data...</span>
        </div>
      </div>
    </>
  );
};

export default RefreshingIndicator;
