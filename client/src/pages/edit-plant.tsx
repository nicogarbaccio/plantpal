import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { EnhancedUserPlant } from "@/types";
import PlantForm from "@/components/plant-form";

// Create form schema (similar to add-plant but without plantId)
const formSchema = z.object({
  plantId: z.number().min(1, "Please select a plant"),
  nickname: z.string().min(1, "Nickname is required"),
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
  const id = params.id ? parseInt(params.id) : 0;

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
        nickname: userPlant.nickname,
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
              submitText="Save Changes"
              isEdit={true}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
