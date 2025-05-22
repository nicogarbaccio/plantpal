import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { toast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { EnhancedUserPlant } from "@/types";
import PlantForm from "@/components/plant-form";

// Create form schema (similar to add-plant)
const formSchema = z.object({
  plantId: z.number().min(1, "Please select a plant"),
  nickname: z.string().optional(),
  location: z.string().min(1, "Location is required"),
  wateringFrequency: z.number().min(1, "Watering frequency is required"),
  notes: z.string().optional(),
  imageUrl: z.string().optional(),
  lastWatered: z.string(), // ISO date string
  nextWaterDate: z.string(), // ISO date string
});

export default function EditPlant() {
  const params = useParams();
  const [, navigate] = useLocation();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const id = params.id ? parseInt(params.id) : 0;

  // Delete plant mutation
  const deletePlantMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/user-plants/${id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete plant");
      }
      return true; // Success with no content
    },
    onSuccess: () => {
      toast({
        title: "Plant deleted",
        description: "Your plant has been removed from your collection.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user-plants"] });
      navigate("/my-collection");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description:
          error.message || "Failed to delete plant. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Fetch user plant data
  const { data: userPlant, isLoading } = useQuery<EnhancedUserPlant>({
    queryKey: [`/api/user-plants/${id}`],
    enabled: id > 0,
  });

  // Form setup
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      plantId: 0,
      nickname: "",
      location: "",
      wateringFrequency: 7,
      notes: "",
      imageUrl: "",
      lastWatered: new Date().toISOString().split("T")[0],
      nextWaterDate: new Date().toISOString().split("T")[0],
    },
  });

  // Update form when user plant data is loaded
  useEffect(() => {
    if (userPlant) {
      form.reset({
        plantId: userPlant.plantId,
        nickname: userPlant.nickname || undefined,
        location: userPlant.location,
        wateringFrequency: userPlant.wateringFrequency,
        notes: userPlant.notes || "",
        imageUrl: userPlant.imageUrl || "",
        lastWatered: new Date(userPlant.lastWatered)
          .toISOString()
          .split("T")[0],
        nextWaterDate: new Date(userPlant.nextWaterDate)
          .toISOString()
          .split("T")[0],
      });
    }
  }, [userPlant, form]);

  // Update plant mutation
  const updatePlantMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const response = await apiRequest("PATCH", `/api/user-plants/${id}`, {
        nickname: data.nickname,
        location: data.location,
        wateringFrequency: data.wateringFrequency,
        notes: data.notes?.trim() || undefined,
        imageUrl: data.imageUrl?.trim() || undefined,
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.errors) {
          throw new Error(`Validation failed:\n${error.errors.join("\n")}`);
        } else {
          throw new Error(error.message || "Failed to update plant");
        }
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Plant updated!",
        description: "Your plant has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/user-plants/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/user-plants"] });
      navigate("/my-collection");
    },
    onError: (error: Error) => {
      console.error("Failed to update plant:", error);
      toast({
        title: "Error",
        description:
          error.message || "Failed to update plant. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    updatePlantMutation.mutate(data);
  };

  const handleCancel = () => {
    navigate("/my-collection");
  };

  if (!userPlant && !isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-semibold mb-4">Plant Not Found</h2>
        <p className="mb-6">
          The plant you're trying to edit doesn't exist or has been removed.
        </p>
        <button
          onClick={() => navigate("/my-collection")}
          className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-[12px]"
        >
          Back to My Collection
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-poppins">Edit Plant</CardTitle>
          </CardHeader>
          <CardContent>
            <PlantForm
              form={form}
              isLoading={isLoading || updatePlantMutation.isPending}
              onSubmit={onSubmit}
              onCancel={handleCancel}
              submitText="Save Changes"
              isEdit={true}
            />

            <div className="mt-8 pt-6 border-t">
              <h3 className="text-lg font-medium text-red-600 mb-2">
                Danger Zone
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Once you delete a plant, there is no going back. Please be
                certain.
              </p>
              <Button
                variant="destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
                disabled={deletePlantMutation.isPending}
              >
                Delete Plant
              </Button>
            </div>

            <AlertDialog
              open={isDeleteDialogOpen}
              onOpenChange={setIsDeleteDialogOpen}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete {userPlant?.nickname} from your
                    collection. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => deletePlantMutation.mutate()}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
