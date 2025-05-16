import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import AuthGuard from "@/components/auth-guard";
import { EnhancedUserPlant } from "@/types";
import MyPlantCard from "@/components/my-plant-card";
import CareStatusOverview from "@/components/care-status-overview";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export default function MyCollection() {
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("last-watered");

  // Fetch user's plant collection
  const { data: userPlants, isLoading } = useQuery<EnhancedUserPlant[]>({
    queryKey: ["/api/user-plants"],
    retry: false,
  });

  // Fetch plants status for care overview
  const { data: needsWaterPlants } = useQuery<EnhancedUserPlant[]>({
    queryKey: ["/api/plants-status/needs-water"],
  });

  const { data: healthyPlants } = useQuery<EnhancedUserPlant[]>({
    queryKey: ["/api/plants-status/healthy"],
  });

  const { data: upcomingPlants } = useQuery<EnhancedUserPlant[]>({
    queryKey: ["/api/plants-status/upcoming"],
  });

  // Filter and sort the plants based on selected options
  const filteredPlants = userPlants
    ? userPlants.filter((plant) => {
        if (filter === "all") return true;
        if (
          filter === "needs-water" &&
          needsWaterPlants?.some((p) => p.id === plant.id)
        )
          return true;
        if (filter === "recently-added") {
          // Consider plants added in the last 7 days as "recently added"
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          return new Date(plant.createdAt) >= sevenDaysAgo;
        }
        return false;
      })
    : [];

  // Sort the filtered plants
  const sortedPlants = [...filteredPlants].sort((a, b) => {
    if (sortBy === "last-watered") {
      return (
        new Date(b.lastWatered || 0).getTime() -
        new Date(a.lastWatered || 0).getTime()
      );
    }
    if (sortBy === "name") {
      return (a.nickname || a.plant?.name || "").localeCompare(
        b.nickname || b.plant?.name || ""
      );
    }
    if (sortBy === "next-water-date") {
      return (
        new Date(a.nextWaterDate || 0).getTime() -
        new Date(b.nextWaterDate || 0).getTime()
      );
    }
    if (sortBy === "recently-added") {
      return (
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
      );
    }
    return 0;
  });

  return (
    <AuthGuard>
      <div className="bg-accent py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h2 className="text-2xl font-poppins font-semibold mb-2">
                My Plant Collection
              </h2>
              <p className="text-gray-600 font-lato">
                Manage and track the health of your plants
              </p>
            </div>
            <Link href="/my-collection/add">
              <Button className="mt-4 md:mt-0 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-[12px] font-poppins">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add New Plant
              </Button>
            </Link>
          </div>

          {/* Care Status Overview */}
          <CareStatusOverview
            needsWaterCount={needsWaterPlants?.length || 0}
            healthyCount={healthyPlants?.length || 0}
            upcomingCount={upcomingPlants?.length || 0}
            isLoading={isLoading}
          />

          {/* Filter & Sort Bar */}
          <div className="bg-white rounded-[12px] shadow-md p-4 mb-8 flex flex-col md:flex-row justify-between">
            <div className="flex flex-wrap items-center gap-4 mb-4 md:mb-0">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                className={`px-4 py-2 ${
                  filter === "all"
                    ? "bg-primary text-white"
                    : "bg-accent text-charcoal"
                } rounded-[12px] font-poppins`}
                onClick={() => setFilter("all")}
              >
                All Plants
              </Button>
              <Button
                variant={filter === "needs-water" ? "default" : "outline"}
                className={`px-4 py-2 ${
                  filter === "needs-water"
                    ? "bg-primary text-white"
                    : "bg-accent text-charcoal"
                } rounded-[12px] font-poppins`}
                onClick={() => setFilter("needs-water")}
              >
                Needs Water
              </Button>
              <Button
                variant={filter === "recently-added" ? "default" : "outline"}
                className={`px-4 py-2 ${
                  filter === "recently-added"
                    ? "bg-primary text-white"
                    : "bg-accent text-charcoal"
                } rounded-[12px] font-poppins`}
                onClick={() => setFilter("recently-added")}
              >
                Recently Added
              </Button>
            </div>
            <div className="flex items-center">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-accent border border-gray-200 rounded-[12px] font-lato text-sm w-full sm:w-48">
                  <SelectValue placeholder="Sort by: Last Watered" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last-watered">
                    Sort by: Last Watered
                  </SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="next-water-date">
                    Next Water Date
                  </SelectItem>
                  <SelectItem value="recently-added">Recently Added</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* My Plants Collection Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              // Loading skeletons
              Array(6)
                .fill(0)
                .map((_, index) => (
                  <div
                    key={`plant-skeleton-${index}`}
                    className="bg-white rounded-[12px] overflow-hidden shadow-md"
                  >
                    <Skeleton className="w-full h-48" />
                    <div className="p-4">
                      <Skeleton className="h-6 w-3/4 mb-1" />
                      <Skeleton className="h-4 w-1/2 mb-3" />
                      <Skeleton className="h-4 w-full mb-3" />
                      <Skeleton className="h-2 w-full mb-4" />
                      <div className="grid grid-cols-2 gap-3">
                        <Skeleton className="h-10" />
                        <Skeleton className="h-10" />
                      </div>
                    </div>
                  </div>
                ))
            ) : sortedPlants.length === 0 ? (
              <div className="col-span-3 bg-white rounded-[12px] p-8 text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 mx-auto text-gray-400 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No plants in your collection
                </h3>
                <p className="text-gray-500 mb-6">
                  Start adding plants to track their care schedule
                </p>
                <Link href="/my-collection/add">
                  <Button className="bg-primary hover:bg-primary/90 text-white rounded-[12px]">
                    Add Your First Plant
                  </Button>
                </Link>
              </div>
            ) : (
              sortedPlants.map((plant) => (
                <MyPlantCard key={plant.id} userPlant={plant} />
              ))
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
