import { User, Plant, UserPlant, WateringHistory, Category } from "@shared/schema";

// Enhanced UserPlant type with related plant information
export interface EnhancedUserPlant extends UserPlant {
  plant?: Plant;
}

// Plant status types
export enum PlantStatus {
  Healthy = "healthy",
  NeedsWater = "needs-water",
  Upcoming = "upcoming"
}

// Watering response type
export interface WateringResponse {
  wateringRecord: WateringHistory;
  userPlant: EnhancedUserPlant;
}

// Form submission types
export interface AddPlantFormData {
  plantId: number;
  nickname: string;
  location: string;
  wateringFrequency: number;
  notes?: string;
  imageUrl?: string;
  lastWatered?: string;  // ISO date string YYYY-MM-DD
  nextWaterDate?: string;  // ISO date string YYYY-MM-DD
}

export interface WaterPlantFormData {
  notes?: string;
}

export interface UpdatePlantFormData {
  nickname?: string;
  location?: string;
  wateringFrequency?: number;
  notes?: string;
  imageUrl?: string;
}

// Filter types
export interface PlantFilters {
  category?: string;
  difficulty?: string;
  searchTerm?: string;
  sortBy?: string;
}

export interface CollectionFilters {
  status?: PlantStatus;
  location?: string;
  searchTerm?: string;
  sortBy?: string;
}
