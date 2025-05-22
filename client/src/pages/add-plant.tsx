import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plant } from "@shared/schema";
import { AddPlantFormData } from "@/types";
import PlantForm from "@/components/plant-form";

// Create form schema
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

export default function AddPlant() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  const returnTo =
    searchParams.get("returnTo") || document.referrer || "/my-collection";
  const preselectedPlantId = searchParams.get("plantId")
    ? parseInt(searchParams.get("plantId")!)
    : undefined;

  // Fetch catalog plants
  const { data: plants, isLoading: plantsLoading } = useQuery<Plant[]>({
    queryKey: ["/api/plants"],
  });

  // Get current date with time set to noon to avoid timezone issues
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const todayString = today.toISOString();

  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekString = nextWeek.toISOString();

  // Set up form with preselected plant if available
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      plantId: preselectedPlantId || 0,
      nickname: "",
      location: "Living Room", // Set a default location
      wateringFrequency: 7, // Default to weekly watering
      notes: "",
      imageUrl: "",
      lastWatered: todayString,
      nextWaterDate: nextWeekString,
    },
  });

  // Get selected plant details when plantId changes
  const selectedPlantId = form.watch("plantId");
  const selectedPlant = plants?.find((p) => p.id === selectedPlantId);

  // Update watering frequency when a plant is selected
  useEffect(() => {
    if (selectedPlant && !form.getValues("wateringFrequency")) {
      form.setValue("wateringFrequency", selectedPlant.wateringFrequency);
    }
    if (selectedPlant && !form.getValues("nickname")) {
      form.setValue("nickname", selectedPlant.name);
    }
    if (selectedPlant && !form.getValues("imageUrl")) {
      form.setValue("imageUrl", selectedPlant.imageUrl || "");
    }
  }, [selectedPlant, form]);

  // Add plant mutation
  const addPlantMutation = useMutation({
    mutationFn: async (data: AddPlantFormData) => {
      const response = await apiRequest("POST", "/api/user-plants", data);
      if (!response.ok) {
        const error = await response.json();
        if (error.errors) {
          // Format validation errors
          throw new Error(`Validation failed:\n${error.errors.join("\n")}`);
        } else {
          throw new Error(error.message || "Failed to add plant");
        }
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Plant added!",
        description: "Your plant has been added to your collection.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user-plants"] });
      navigate("/my-collection");
    },
    onError: (error: Error) => {
      console.error("Failed to add plant:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add plant. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    // Calculate next water date based on last watered date and frequency
    const lastWatered = new Date(data.lastWatered);
    const nextWaterDate = new Date(lastWatered);
    nextWaterDate.setDate(lastWatered.getDate() + data.wateringFrequency);

    // Set time to noon UTC to avoid timezone issues
    lastWatered.setUTCHours(12, 0, 0, 0);
    nextWaterDate.setUTCHours(12, 0, 0, 0);

    const formData: AddPlantFormData = {
      ...data,
      wateringFrequency: Math.max(1, data.wateringFrequency), // Ensure positive watering frequency
      // Clean up optional fields
      notes: data.notes?.trim() || undefined,
      imageUrl: data.imageUrl?.trim() || undefined,
      lastWatered: lastWatered.toISOString(),
      nextWaterDate: nextWaterDate.toISOString(),
    };

    addPlantMutation.mutate(formData);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-poppins">
              Add New Plant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PlantForm
              form={form}
              plants={plants}
              isLoading={plantsLoading || addPlantMutation.isPending}
              onSubmit={onSubmit}
              onCancel={() => navigate(returnTo)}
              submitText="Add to Collection"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
