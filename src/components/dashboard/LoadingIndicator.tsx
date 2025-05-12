
import { Loader2 } from "lucide-react";

const LoadingIndicator = () => {
  return (
    <div className="text-center py-12">
      <div className="inline-flex flex-col items-center">
        <Loader2 className="h-12 w-12 text-movement-green animate-spin mb-4" />
        <p className="text-lg font-medium text-gray-700">Loading data...</p>
        <p className="text-sm text-gray-500 mt-2">
          This may take a moment as we fetch your data
        </p>
      </div>
    </div>
  );
};

export default LoadingIndicator;
