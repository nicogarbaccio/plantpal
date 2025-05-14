import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import PlantCard from "@/components/plant-card";
import CategoryCard from "@/components/category-card";
import { Plant, Category } from "@shared/schema";
import { useFilterPlants } from "@/hooks/use-filter-plants";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export default function Explore() {
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [sortBy, setSortBy] = useState("popular");
  
  // Fetch plants
  const plantsQuery = useQuery<Plant[]>({
    queryKey: ['/api/plants'],
  });
  
  // Fetch categories
  const categoriesQuery = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });
  
  // Filter and sort plants
  const filteredPlants = useFilterPlants(plantsQuery.data || [], {
    category,
    searchTerm,
    sortBy
  });
  
  return (
    <div>
      {/* Hero Section/Search Bar */}
      <div className="search-container relative py-16 md:py-24">
        <div className="absolute inset-0 bg-charcoal bg-opacity-50"></div>
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-8">
            <h2 className="text-white text-3xl md:text-4xl font-poppins font-semibold mb-4">
              Discover Your Perfect Plants
            </h2>
            <p className="text-white text-lg md:max-w-2xl mx-auto font-lato">
              Browse our extensive catalog and find the perfect additions to your indoor jungle.
            </p>
          </div>
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-grow">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search plants by name or type..."
                    className="w-full p-6 rounded-[12px] shadow-lg font-lato text-base"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" />
                      <path d="M21 21l-4.35-4.35" />
                    </svg>
                  </span>
                </div>
              </div>
              <div>
                <Button className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white p-6 h-[58px] rounded-[12px] shadow-lg font-poppins flex items-center justify-center">
                  Find Plants
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Categories */}
      <div className="container mx-auto px-4 py-12">
        <h3 className="text-2xl font-poppins font-semibold mb-8">Popular Categories</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categoriesQuery.isLoading ? (
            // Loading skeletons for categories
            Array(4).fill(0).map((_, index) => (
              <div key={`category-skeleton-${index}`} className="rounded-[12px] overflow-hidden relative h-40">
                <Skeleton className="w-full h-full" />
              </div>
            ))
          ) : categoriesQuery.error ? (
            <div className="col-span-4 text-center text-red-500">
              Error loading categories
            </div>
          ) : (
            categoriesQuery.data?.map((category) => (
              <CategoryCard 
                key={category.id}
                category={category}
                onClick={() => setCategory(category.name)}
              />
            ))
          )}
        </div>
      </div>

      {/* Plant Catalog */}
      <div className="bg-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <h3 className="text-2xl font-poppins font-semibold">Plant Catalog</h3>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
              <Select value={category || "all"} onValueChange={(value) => setCategory(value === "all" ? undefined : value)}>
                <SelectTrigger className="bg-accent border border-gray-200 rounded-[12px] font-lato text-sm w-full sm:w-40">
                  <SelectValue placeholder="All Plants" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plants</SelectItem>
                  {categoriesQuery.data?.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-accent border border-gray-200 rounded-[12px] font-lato text-sm w-full sm:w-48">
                  <SelectValue placeholder="Sort by: Popular" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Sort by: Popular</SelectItem>
                  <SelectItem value="name">Alphabetical</SelectItem>
                  <SelectItem value="easiest">Easiest Care</SelectItem>
                  <SelectItem value="newest">Newest Added</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Plant Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {plantsQuery.isLoading ? (
              // Loading skeletons for plants
              Array(8).fill(0).map((_, index) => (
                <div key={`plant-skeleton-${index}`} className="bg-white rounded-[12px] overflow-hidden shadow-md">
                  <Skeleton className="w-full h-56" />
                  <div className="p-4">
                    <Skeleton className="h-6 w-3/4 mb-1" />
                    <Skeleton className="h-4 w-1/2 mb-3" />
                    <Skeleton className="h-4 w-full mb-4" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
              ))
            ) : plantsQuery.error ? (
              <div className="col-span-4 text-center text-red-500">
                Error loading plants
              </div>
            ) : filteredPlants.length === 0 ? (
              <div className="col-span-4 text-center text-gray-500 py-8">
                No plants found matching your criteria
              </div>
            ) : (
              filteredPlants.map((plant) => (
                <PlantCard key={plant.id} plant={plant} />
              ))
            )}
          </div>
          
          {filteredPlants.length > 0 && (
            <div className="mt-8 text-center">
              <Button className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-[12px] font-poppins inline-flex items-center">
                <span>Load More</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
