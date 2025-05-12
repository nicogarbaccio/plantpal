import { formatDistanceToNow, addDays, isBefore, isAfter, differenceInDays } from "date-fns";
import { EnhancedUserPlant, PlantStatus } from "@/types";

// Calculate watering status for a single plant
export function getPlantWateringStatus(userPlant: EnhancedUserPlant): PlantStatus {
  if (!userPlant.lastWatered || !userPlant.nextWaterDate) {
    return PlantStatus.NeedsWater;
  }

  const today = new Date();
  const nextWaterDate = new Date(userPlant.nextWaterDate);
  
  if (isBefore(nextWaterDate, today)) {
    return PlantStatus.NeedsWater;
  } else if (differenceInDays(nextWaterDate, today) <= 2) {
    return PlantStatus.Upcoming;
  } else {
    return PlantStatus.Healthy;
  }
}

// Format last watered date to human-readable string
export function formatLastWatered(lastWatered: Date | string | null | undefined): string {
  if (!lastWatered) return "Never";
  
  return formatDistanceToNow(new Date(lastWatered), { addSuffix: true });
}

// Calculate next water date based on last watered date and frequency
export function calculateNextWaterDate(lastWatered: Date | string, frequency: number): Date {
  const lastWateredDate = new Date(lastWatered);
  return addDays(lastWateredDate, frequency);
}

// Calculate water progress percentage
export function calculateWaterProgress(userPlant: EnhancedUserPlant): number {
  if (!userPlant.lastWatered || !userPlant.nextWaterDate) {
    return 0;
  }
  
  const now = new Date();
  const lastWatered = new Date(userPlant.lastWatered);
  const nextWaterDate = new Date(userPlant.nextWaterDate);
  
  // If already overdue, return 0%
  if (isBefore(nextWaterDate, now)) {
    return 0;
  }
  
  // Calculate total days in the watering cycle
  const totalDays = differenceInDays(nextWaterDate, lastWatered);
  
  // Calculate days elapsed since last watering
  const daysElapsed = differenceInDays(now, lastWatered);
  
  // Calculate remaining percentage
  const percentRemaining = (totalDays - daysElapsed) / totalDays * 100;
  
  return Math.max(0, Math.min(100, percentRemaining));
}

// Get color for water progress bar based on status
export function getWaterStatusColor(status: PlantStatus): string {
  switch (status) {
    case PlantStatus.NeedsWater:
      return "bg-[#FF9F43]"; // warning orange
    case PlantStatus.Upcoming:
      return "bg-blue-400";  // upcoming blue
    case PlantStatus.Healthy:
      return "bg-[#2ECC71]"; // healthy green
    default:
      return "bg-gray-300";  // default/unknown
  }
}

// Get text for water status
export function getWaterStatusText(userPlant: EnhancedUserPlant): string {
  const status = getPlantWateringStatus(userPlant);
  
  if (status === PlantStatus.NeedsWater) {
    if (userPlant.nextWaterDate && isBefore(new Date(userPlant.nextWaterDate), new Date())) {
      return `${formatDistanceToNow(new Date(userPlant.nextWaterDate))} overdue`;
    }
    return "Needs water today";
  } else if (status === PlantStatus.Upcoming) {
    return userPlant.nextWaterDate 
      ? `Water in ${formatDistanceToNow(new Date(userPlant.nextWaterDate), { addSuffix: false })}`
      : "Water soon";
  } else {
    return "Healthy";
  }
}
