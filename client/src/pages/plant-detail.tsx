import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useRoute, useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import PlantGallery from "@/components/plant-gallery";
import WaterProgress from "@/components/water-progress";
import { queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { Plant, WateringHistory } from "@shared/schema";
import { EnhancedUserPlant, WateringResponse } from "@/types";
import { apiRequest } from "@/lib/queryClient";
import { format, formatDistanceToNow, isToday } from "date-fns";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function PlantDetail() {
  const [, matchUserPlant] = useRoute("/my-collection/:id");
  const params = useParams();
  const [, navigate] = useLocation();
  const [waterNotes, setWaterNotes] = useState("");
  const [isWaterDialogOpen, setIsWaterDialogOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<number | null>(null);
  const [editingWateringRecord, setEditingWateringRecord] =
    useState<WateringHistory | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const id = params.id ? parseInt(params.id) : 0;
  const isUserPlantView = Boolean(matchUserPlant);

  // Fetch catalog plant data
  const catalogPlantQuery = useQuery<Plant>({
    queryKey: [`/api/plants/${isUserPlantView ? "" : id}`],
    enabled: !isUserPlantView && id > 0,
  });

  // Fetch user plant data
  const userPlantQuery = useQuery<EnhancedUserPlant>({
    queryKey: [`/api/user-plants/${isUserPlantView ? id : ""}`],
    enabled: isUserPlantView && id > 0,
  });

  // Fetch watering history for user plant
  const wateringHistoryQuery = useQuery<WateringHistory[]>({
    queryKey: [`/api/user-plants/${id}/watering-history`],
    enabled: isUserPlantView && id > 0,
  });

  // Water plant mutation
  const waterPlantMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "POST",
        `/api/user-plants/${id}/water`,
        { notes: waterNotes }
      );
      return response.json() as Promise<WateringResponse>;
    },
    onSuccess: () => {
      toast({
        title: "Plant watered!",
        description: "Watering schedule updated successfully.",
      });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/user-plants/${id}`] });
      queryClient.invalidateQueries({
        queryKey: [`/api/user-plants/${id}/watering-history`],
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

      // Close dialog and reset form
      setIsWaterDialogOpen(false);
      setWaterNotes("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to water plant. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update watering record mutation
  const updateWateringMutation = useMutation({
    mutationFn: async (data: {
      id: number;
      wateredDate: string;
      notes: string | null;
    }) => {
      const response = await apiRequest(
        "PATCH",
        `/api/watering-history/${data.id}`,
        { wateredDate: data.wateredDate, notes: data.notes }
      );
      return response.json() as Promise<WateringHistory>;
    },
    onSuccess: () => {
      toast({
        title: "Watering record updated!",
        description: "The watering record has been updated successfully.",
      });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/user-plants/${id}`] });
      queryClient.invalidateQueries({
        queryKey: [`/api/user-plants/${id}/watering-history`],
      });
      setIsEditDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update watering record. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete watering record mutation
  const deleteWateringMutation = useMutation({
    mutationFn: async (recordId: number) => {
      const response = await apiRequest(
        "DELETE",
        `/api/watering-history/${recordId}`
      );
      if (!response.ok && response.status !== 204) {
        let errorMessage = "Failed to delete watering record";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // If we can't parse the error message, use the default
        }
        throw new Error(errorMessage);
      }
    },
    onSuccess: () => {
      toast({
        title: "Watering record deleted!",
        description: "The watering record has been deleted successfully.",
      });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/user-plants/${id}`] });
      queryClient.invalidateQueries({
        queryKey: [`/api/user-plants/${id}/watering-history`],
      });
      setRecordToDelete(null);
      setIsConfirmDeleteOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Determine which plant data to display
  const plant = isUserPlantView
    ? userPlantQuery.data?.plant
    : catalogPlantQuery.data;

  const userPlant = userPlantQuery.data;
  const wateringHistory = wateringHistoryQuery.data || [];

  // Handle adding to collection
  const handleAddToCollection = () => {
    if (!catalogPlantQuery.data) return;
    navigate(`/my-collection/add?plantId=${catalogPlantQuery.data.id}`);
  };

  // Handle watering the plant
  const handleWaterPlant = () => {
    waterPlantMutation.mutate();
  };

  // Handle opening edit dialog
  const handleEditWatering = (record: WateringHistory) => {
    setEditingWateringRecord(record);
    setEditDate(new Date(record.wateredDate).toISOString().split("T")[0]);
    setEditNotes(record.notes || "");
    setIsEditDialogOpen(true);
  };

  // Handle updating watering record
  const handleUpdateWatering = () => {
    if (!editingWateringRecord) return;
    updateWateringMutation.mutate({
      id: editingWateringRecord.id,
      wateredDate: editDate,
      notes: editNotes,
    });
  };

  // Handle initiating delete watering record
  const handleDeleteInitiate = (recordId: number) => {
    setRecordToDelete(recordId);
    setIsConfirmDeleteOpen(true);
  };

  // Handle confirming delete watering record
  const handleConfirmDelete = () => {
    if (recordToDelete) {
      deleteWateringMutation.mutate(recordToDelete);
    }
  };

  const isLoading = isUserPlantView
    ? userPlantQuery.isLoading
    : catalogPlantQuery.isLoading;

  if (!isLoading && !plant) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-semibold mb-4">Plant Not Found</h2>
        <p className="mb-6">
          The plant you're looking for doesn't exist or has been removed.
        </p>
        <Button
          onClick={() => navigate(isUserPlantView ? "/my-collection" : "/")}
          className="bg-primary hover:bg-primary/90 text-white"
        >
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left column - Images */}
        <div className="md:col-span-5">
          {isLoading ? (
            <Skeleton className="w-full h-[400px] rounded-[12px]" />
          ) : (
            <PlantGallery
              mainImage={
                isUserPlantView && userPlant?.imageUrl
                  ? userPlant.imageUrl || undefined
                  : plant?.imageUrl || undefined
              }
              plantName={plant?.name || "Plant"}
            />
          )}
        </div>

        {/* Right column - Plant details */}
        <div className="md:col-span-7">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <div className="flex space-x-4 mt-6">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-semibold font-poppins mb-2">
                {isUserPlantView ? userPlant?.nickname : plant?.name}
              </h1>
              <p className="text-gray-500 text-sm font-lato italic mb-4">
                {plant?.botanicalName}
              </p>

              {isUserPlantView && userPlant?.location && (
                <p className="text-gray-700 mb-4">
                  <span className="inline-flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2 text-secondary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Location: {userPlant.location}
                  </span>
                </p>
              )}

              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-blue-400 mr-1"
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
                    {isUserPlantView
                      ? `Every ${userPlant?.wateringFrequency} days`
                      : `Every ${plant?.wateringFrequency} days`}
                  </span>
                </div>
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-yellow-400 mr-1"
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
                    {plant?.lightRequirements}
                  </span>
                </div>
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-primary mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"
                    />
                  </svg>
                  <span className="text-sm font-lato">{plant?.difficulty}</span>
                </div>
              </div>

              <p className="text-gray-700 mb-6">{plant?.description}</p>

              {isUserPlantView && userPlant ? (
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2">Watering Status</h3>
                  <WaterProgress userPlant={userPlant} />

                  <div className="flex flex-col sm:flex-row gap-4 mt-6">
                    <Dialog
                      open={isWaterDialogOpen}
                      onOpenChange={setIsWaterDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button
                          className="bg-primary hover:bg-primary/90 text-white"
                          disabled={waterPlantMutation.isPending}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 mr-2"
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
                          Water Plant
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Water your plant</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                          <div className="mb-4">
                            <p className="text-sm text-gray-500">
                              Add optional notes about this watering session:
                            </p>
                          </div>
                          <Textarea
                            placeholder="E.g., Bottom watered, Added fertilizer, etc."
                            value={waterNotes}
                            onChange={(e) => setWaterNotes(e.target.value)}
                            className="min-h-[100px]"
                          />
                        </div>
                        <div className="flex justify-end gap-3">
                          <Button
                            variant="outline"
                            onClick={() => setIsWaterDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            className="bg-primary hover:bg-primary/90 text-white"
                            onClick={handleWaterPlant}
                            disabled={waterPlantMutation.isPending}
                          >
                            {waterPlantMutation.isPending
                              ? "Watering..."
                              : "Confirm Watering"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button
                      variant="outline"
                      onClick={() => navigate(`/my-collection/edit/${id}`)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
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
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  className="bg-primary hover:bg-primary/90 text-white py-2 px-6 rounded-[12px] font-poppins"
                  onClick={handleAddToCollection}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
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
                  Add to My Collection
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Additional content for user plant view */}
      {isUserPlantView && (
        <div className="mt-12">
          <Tabs defaultValue="care-history">
            <TabsList className="grid w-full md:w-auto grid-cols-2 md:inline-flex">
              <TabsTrigger value="care-history">Care History</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>
            <TabsContent value="care-history" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Watering History</CardTitle>
                </CardHeader>
                <CardContent>
                  {wateringHistoryQuery.isLoading ? (
                    <div className="space-y-4">
                      {Array(3)
                        .fill(0)
                        .map((_, i) => (
                          <div
                            key={i}
                            className="flex justify-between items-center py-3"
                          >
                            <Skeleton className="h-6 w-32" />
                            <Skeleton className="h-4 w-48" />
                          </div>
                        ))}
                    </div>
                  ) : wateringHistory.length === 0 ? (
                    <p className="text-gray-500 text-center py-6">
                      No watering history available
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {[...wateringHistory]
                        .sort((a, b) => {
                          // First compare by watered date
                          const dateComparison =
                            new Date(b.wateredDate).getTime() -
                            new Date(a.wateredDate).getTime();
                          if (dateComparison !== 0) return dateComparison;

                          // If watered dates are the same, compare by created time
                          const aCreated = a.createdAt
                            ? new Date(a.createdAt).getTime()
                            : 0;
                          const bCreated = b.createdAt
                            ? new Date(b.createdAt).getTime()
                            : 0;
                          return bCreated - aCreated;
                        })
                        .map((record, index) => (
                          <div key={record.id} className="py-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="font-medium">
                                  {format(
                                    new Date(record.wateredDate),
                                    "MMM d, yyyy"
                                  )}
                                </span>
                                <span className="text-gray-500 text-sm ml-2">
                                  {isToday(new Date(record.wateredDate))
                                    ? "Today"
                                    : formatDistanceToNow(
                                        new Date(record.wateredDate),
                                        {
                                          addSuffix: true,
                                        }
                                      )}
                                </span>
                                {record.notes && (
                                  <p className="text-gray-600 text-sm mt-1">
                                    {record.notes}
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditWatering(record)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="text-white"
                                  onClick={() =>
                                    handleDeleteInitiate(record.id)
                                  }
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>
                            {index < wateringHistory.length - 1 && (
                              <Separator className="mt-3" />
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="notes" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Plant Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  {userPlantQuery.isLoading ? (
                    <Skeleton className="h-24 w-full" />
                  ) : !userPlant?.notes ? (
                    <p className="text-gray-500 text-center py-6">
                      No notes added yet
                    </p>
                  ) : (
                    <p className="text-gray-700">{userPlant.notes}</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Watering Record</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="watered-date">Date</label>
              <input
                id="watered-date"
                type="date"
                className="border rounded-lg p-2"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="notes">Notes (optional)</label>
              <Textarea
                id="notes"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Add any notes about this watering..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateWatering}
              disabled={updateWateringMutation.isPending}
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isConfirmDeleteOpen}
        onOpenChange={setIsConfirmDeleteOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Watering Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this watering record? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsConfirmDeleteOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
