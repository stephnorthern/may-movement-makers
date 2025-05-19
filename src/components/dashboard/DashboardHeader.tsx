
import CountdownTimer from "@/components/CountdownTimer";

const DashboardHeader = () => {
  return (
    <>
      <div className="text-center">
        <h1 className="text-4xl font-bold gradient-text">SingleStone May Movement Challenge</h1>
        <p className="text-gray-600">Let's get movin'! </p>
      </div>
      
      {/* Countdown Timer */}
      <div className="max-w-md mx-auto">
        <CountdownTimer />
      </div>
    </>
  );
};

export default DashboardHeader;
