
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Timer } from "lucide-react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const CountdownTimer = () => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    // Set the end date for the challenge (June 2, 2025)
    const endDate = new Date("2025-06-02T23:59:59");
    
    // Update countdown every second
    const timer = setInterval(() => {
      const now = new Date();
      const difference = endDate.getTime() - now.getTime();
      
      // If the challenge has ended, clear the interval
      if (difference <= 0) {
        clearInterval(timer);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      
      // Calculate time units
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      
      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  return (
    <Card className="bg-gradient-to-r from-movement-purple/10 to-movement-light-purple/10 border-none shadow-sm">
      <CardHeader className="py-3">
        <CardTitle className="text-sm flex items-center gap-1.5">
          <Timer className="h-4 w-4 text-movement-purple" />
          Challenge Ends: June 2nd, 2025
        </CardTitle>
      </CardHeader>
      <CardContent className="py-2">
        <div className="flex justify-center space-x-2 py-1">
          <TimeUnit value={timeLeft.days} label="Days" />
          <TimeUnit value={timeLeft.hours} label="Hours" />
          <TimeUnit value={timeLeft.minutes} label="Min" />
          <TimeUnit value={timeLeft.seconds} label="Sec" />
        </div>
      </CardContent>
    </Card>
  );
};

const TimeUnit = ({ value, label }: { value: number, label: string }) => (
  <div className="flex flex-col items-center">
    <div className="bg-movement-purple text-white text-lg font-bold rounded-md w-10 h-10 flex items-center justify-center">
      {value.toString().padStart(2, '0')}
    </div>
    <span className="text-xs text-gray-500 mt-0.5">{label}</span>
  </div>
);

export default CountdownTimer;
