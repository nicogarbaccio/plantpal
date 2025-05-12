import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface CareStatusOverviewProps {
  needsWaterCount: number;
  healthyCount: number;
  upcomingCount: number;
  isLoading: boolean;
}

export default function CareStatusOverview({ 
  needsWaterCount, 
  healthyCount, 
  upcomingCount,
  isLoading
}: CareStatusOverviewProps) {
  return (
    <Card className="bg-white rounded-[12px] shadow-md p-6 mb-8">
      <h3 className="font-poppins font-medium text-lg mb-4">Care Status</h3>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {isLoading ? (
            // Loading skeletons
            Array(3).fill(0).map((_, index) => (
              <div key={`status-skeleton-${index}`} className="bg-accent rounded-[12px] p-4">
                <Skeleton className="h-12 w-12 rounded-full mb-2" />
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-6 w-16" />
              </div>
            ))
          ) : (
            <>
              <div className="bg-accent rounded-[12px] p-4 flex items-center">
                <div className="bg-red-100 p-3 rounded-full mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#FF9F43]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-lato">Needs Water</p>
                  <p className="font-poppins font-medium text-lg">{needsWaterCount} Plant{needsWaterCount !== 1 ? 's' : ''}</p>
                </div>
              </div>
              
              <div className="bg-accent rounded-[12px] p-4 flex items-center">
                <div className="bg-green-100 p-3 rounded-full mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#2ECC71]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-lato">Healthy</p>
                  <p className="font-poppins font-medium text-lg">{healthyCount} Plant{healthyCount !== 1 ? 's' : ''}</p>
                </div>
              </div>
              
              <div className="bg-accent rounded-[12px] p-4 flex items-center">
                <div className="bg-blue-100 p-3 rounded-full mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-lato">Upcoming Care</p>
                  <p className="font-poppins font-medium text-lg">{upcomingCount} Plant{upcomingCount !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
