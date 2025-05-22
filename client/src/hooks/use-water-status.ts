import { EnhancedUserPlant, PlantStatus } from "@/types";
import { differenceInDays } from "date-fns";

interface WaterStatusResult {
  status: PlantStatus;
  percentRemaining: number;
  statusColor: string;
}

export function useWaterStatus(userPlant: EnhancedUserPlant): WaterStatusResult {
  const today = new Date();
  
  if (userPlant.needsInitialWatering) {
    return {
      status: PlantStatus.Unknown,
      percentRemaining: 0,
      statusColor: "bg-gray-400" // neutral gray for unknown status
    };
  }

  // If dates are missing (but not because of initial watering)
  if (!userPlant.lastWatered || !userPlant.nextWaterDate) {
    return {
      status: PlantStatus.NeedsWater,
      percentRemaining: 0,
      statusColor: "bg-[#FF9F43]" // warning orange
    };
  }
  const lastWatered = new Date(userPlant.lastWatered);
  const nextWaterDate = new Date(userPlant.nextWaterDate);
  
  // Calculate how many days until next watering (can be negative if overdue)
  const daysUntilNextWatering = differenceInDays(nextWaterDate, today);
  
  // Calculate what percentage of watering time is remaining
  const percentRemaining = Math.max(
    0, 
    100 * (daysUntilNextWatering / userPlant.wateringFrequency)
  );
  
  // Determine the status based on days until next watering
  let status: PlantStatus;
  let statusColor: string;
  
  if (daysUntilNextWatering <= 0) {
    // Needs water now or is overdue
    status = PlantStatus.NeedsWater;
    statusColor = "bg-[#FF9F43]"; // warning orange
  } else if (daysUntilNextWatering <= 2) {
    // Upcoming watering (in next 2 days)
    status = PlantStatus.Upcoming;
    statusColor = "bg-blue-400"; // upcoming blue
  } else {
    // Healthy - plenty of time until next watering
    status = PlantStatus.Healthy;
    statusColor = "bg-[#2ECC71]"; // healthy green
  }
  
  return {
    status,
    percentRemaining,
    statusColor
  };
}
