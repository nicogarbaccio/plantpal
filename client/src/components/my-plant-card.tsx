import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { EnhancedUserPlant, WateringResponse } from "@/types";
import { Button } from "@/components/ui/button";
import PlantStatusBanner from "@/components/plant-status-banner";
import WaterProgress from "@/components/water-progress";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useWaterStatus } from "@/hooks/use-water-status";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow, isToday, format, startOfDay } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";

interface MyPlantCardProps {
  userPlant: EnhancedUserPlant;
}

export default function MyPlantCard({ userPlant }: MyPlantCardProps) {
  const { status } = useWaterStatus(userPlant);

  // Water plant mutation
  const waterPlantMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "POST",
        `/api/user-plants/${userPlant.id}/water`,
        { notes: "Regular watering" }
      );
      return response.json() as Promise<WateringResponse>;
    },
    onSuccess: () => {
      toast({
        title: "Plant watered!",
        description: "Watering schedule updated successfully.",
      });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({
        queryKey: [`/api/user-plants/${userPlant.id}`],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user-plants"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/plants-status/needs-water"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/plants-status/healthy"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/plants-status/upcoming"],
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to water plant. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleWaterPlant = () => {
    waterPlantMutation.mutate();
  };

  const statusText = () => {
    if (status === "unknown") {
      return "Watering status unknown";
    } else if (status === "needs-water") {
      return userPlant.nextWaterDate &&
        new Date(userPlant.nextWaterDate) < new Date()
        ? `${formatDistanceToNow(new Date(userPlant.nextWaterDate))} overdue`
        : "Needs water today";
    } else if (status === "upcoming") {
      return userPlant.nextWaterDate
        ? `Water in ${formatDistanceToNow(new Date(userPlant.nextWaterDate), {
            addSuffix: false,
          })}`
        : "Water soon";
    } else {
      return "Healthy";
    }
  };

  const getBannerIcon = () => {
    if (status === "unknown") {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 mr-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    } else if (status === "needs-water") {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 mr-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      );
    } else if (status === "upcoming") {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 mr-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    } else {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 mr-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      );
    }
  };

  return (
    <Card className="bg-white rounded-[12px] overflow-hidden shadow-md">
      <div className="relative">
        <PlantStatusBanner
          status={status}
          statusText={statusText()}
          icon={getBannerIcon()}
        />
        <img
          src={userPlant.imageUrl || userPlant.plant?.imageUrl || ""}
          alt={userPlant.nickname || userPlant.plant?.name}
          className="w-full h-48 object-cover"
        />
      </div>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h4 className="font-poppins font-medium text-lg">
              {userPlant.nickname || userPlant.plant?.name}
            </h4>
            <p className="text-gray-500 text-sm">
              {userPlant.nickname ? (
                <>
                  <span className="block font-lato text-primary">
                    {userPlant.plant?.name}
                  </span>
                  <span className="block font-lato italic">
                    {userPlant.location}
                  </span>
                </>
              ) : (
                <span className="block font-lato italic">
                  {userPlant.location}
                </span>
              )}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-gray-500 hover:text-gray-700">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                  />
                </svg>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <Link href={`/my-collection/${userPlant.id}`}>
                <DropdownMenuItem>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  View Details
                </DropdownMenuItem>
              </Link>
              <Link href={`/my-collection/edit/${userPlant.id}`}>
                <DropdownMenuItem>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                  Edit Plant
                </DropdownMenuItem>
              </Link>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-blue-400 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
              />
            </svg>
            <span className="text-sm font-lato">
              {userPlant.wateringFrequency === 7
                ? "Water weekly"
                : userPlant.wateringFrequency === 14
                ? "Water bi-weekly"
                : userPlant.wateringFrequency === 30
                ? "Water monthly"
                : `Water every ${userPlant.wateringFrequency} days`}
            </span>
          </div>
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-yellow-400 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <span className="text-sm font-lato">
              Needs{" "}
              {(
                userPlant.plant?.lightRequirements || "unknown light level"
              ).toLowerCase()}
            </span>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm font-lato text-gray-500 mb-1">
            Last Watered:{" "}
            <span className="text-charcoal">
              {userPlant.lastWatered
                ? (() => {
                    const lastWateredDate = new Date(userPlant.lastWatered);
                    const now = new Date();
                    const lastWateredLocal = new Date(
                      lastWateredDate.getTime() -
                        lastWateredDate.getTimezoneOffset() * 60000
                    );
                    const todayLocal = new Date(
                      now.getTime() - now.getTimezoneOffset() * 60000
                    );

                    // Compare dates without time
                    const isWateredToday =
                      lastWateredLocal.toISOString().split("T")[0] ===
                      todayLocal.toISOString().split("T")[0];

                    return isWateredToday
                      ? "Today"
                      : `${formatDistanceToNow(lastWateredDate, {
                          addSuffix: true,
                        })}`;
                  })()
                : "Never"}
            </span>
          </p>
          <WaterProgress userPlant={userPlant} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            className={`${
              status === "needs-water"
                ? "bg-primary hover:bg-primary/90"
                : "bg-accent hover:bg-gray-200"
            } text-${
              status === "needs-water" ? "white" : "charcoal"
            } py-2 rounded-[12px] font-poppins text-sm`}
            onClick={handleWaterPlant}
            disabled={waterPlantMutation.isPending}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            {status === "needs-water" ? "Water Now" : "Water"}
          </Button>
          <Link href={`/my-collection/${userPlant.id}`}>
            <Button
              variant="outline"
              className="w-full bg-accent hover:bg-gray-200 text-charcoal py-2 rounded-[12px] font-poppins text-sm"
            >
              View Details
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
