
const LoadingIndicator = () => {
  return (
    <div className="text-center py-12">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-movement-green border-t-transparent"></div>
      <p className="mt-2 text-gray-600">Loading data...</p>
    </div>
  );
};

export default LoadingIndicator;
