
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const ParticipantSkeletons = ({ count = 3 }: { count?: number }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
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
      ))}
    </>
  );
};

export default ParticipantSkeletons;
