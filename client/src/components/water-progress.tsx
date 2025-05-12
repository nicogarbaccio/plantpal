import { EnhancedUserPlant } from "@/types";
import { useWaterStatus } from "@/hooks/use-water-status";
import { formatDistanceToNow } from "date-fns";

interface WaterProgressProps {
  userPlant: EnhancedUserPlant;
}

export default function WaterProgress({ userPlant }: WaterProgressProps) {
  const { percentRemaining, statusColor } = useWaterStatus(userPlant);
  
  return (
    <div>
      {userPlant.lastWatered && userPlant.nextWaterDate && (
        <p className="text-sm font-lato text-gray-500 mb-1">
          Next watering: <span className="text-charcoal">
            {new Date(userPlant.nextWaterDate) <= new Date() 
              ? "Today" 
              : formatDistanceToNow(new Date(userPlant.nextWaterDate), { addSuffix: true })}
          </span>
        </p>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className={`${statusColor} h-2.5 rounded-full`} 
          style={{ width: `${Math.max(0, percentRemaining)}%` }}
        />
      </div>
    </div>
  );
}
