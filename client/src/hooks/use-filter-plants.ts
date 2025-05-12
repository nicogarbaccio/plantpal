import { Plant } from "@shared/schema";
import { PlantFilters } from "@/types";
import { useMemo } from "react";

export function useFilterPlants(plants: Plant[], filters: PlantFilters): Plant[] {
  return useMemo(() => {
    // Start with all plants
    let filteredPlants = [...plants];
    
    // Filter by category if specified
    if (filters.category) {
      filteredPlants = filteredPlants.filter(
        plant => plant.category.toLowerCase() === filters.category?.toLowerCase()
      );
    }
    
    // Filter by difficulty if specified
    if (filters.difficulty) {
      filteredPlants = filteredPlants.filter(
        plant => plant.difficulty.toLowerCase() === filters.difficulty?.toLowerCase()
      );
    }
    
    // Filter by search term if specified
    if (filters.searchTerm && filters.searchTerm.trim() !== '') {
      const searchTermLower = filters.searchTerm.toLowerCase().trim();
      filteredPlants = filteredPlants.filter(
        plant => 
          plant.name.toLowerCase().includes(searchTermLower) ||
          plant.botanicalName.toLowerCase().includes(searchTermLower) ||
          plant.description.toLowerCase().includes(searchTermLower) ||
          plant.category.toLowerCase().includes(searchTermLower)
      );
    }
    
    // Sort plants based on sortBy parameter
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'name':
          // Sort alphabetically by name
          filteredPlants.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case 'easiest':
          // Sort by difficulty (assuming 'Very Easy' < 'Easy' < 'Medium' < 'Difficult')
          const difficultyRank = {
            'Very Easy': 1,
            'Easy': 2,
            'Medium': 3,
            'Difficult': 4
          };
          filteredPlants.sort((a, b) => {
            const rankA = difficultyRank[a.difficulty as keyof typeof difficultyRank] || 999;
            const rankB = difficultyRank[b.difficulty as keyof typeof difficultyRank] || 999;
            return rankA - rankB;
          });
          break;
        case 'newest':
          // Sort by ID (assuming higher ID = newer addition)
          filteredPlants.sort((a, b) => b.id - a.id);
          break;
        case 'popular':
        default:
          // For now, we'll keep the original order for 'popular'
          // In a real app, this might be based on user interactions
          break;
      }
    }
    
    return filteredPlants;
  }, [plants, filters.category, filters.difficulty, filters.searchTerm, filters.sortBy]);
}
