import { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { format, addDays } from "date-fns";
import { Button } from "@/components/ui/button";
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
import { Plant } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

// Create form schema
const formSchema = z.object({
  plantId: z.number().min(1, "Please select a plant"),
  nickname: z.string().min(1, "Nickname is required"),
  location: z.string().min(1, "Location is required"),
  wateringFrequency: z.number().min(1, "Watering frequency is required"),
  notes: z.string().optional(),
  imageUrl: z.string().optional(),
  lastWatered: z.string(),
  nextWaterDate: z.string(),
});

interface PlantFormProps {
  form: UseFormReturn<z.infer<typeof formSchema>>;
  plants?: Plant[] | null;
  isLoading: boolean;
  onSubmit: (data: z.infer<typeof formSchema>) => void;
  onCancel?: () => void;
  submitText: string;
  isEdit?: boolean;
}

export default function PlantForm({
  form,
  plants,
  isLoading,
  onSubmit,
  onCancel,
  submitText,
  isEdit = false,
}: PlantFormProps) {
  // Get selected plant details
  const selectedPlantId = form.watch("plantId");
  const selectedPlant = plants?.find((p) => p.id === selectedPlantId);

  // Common form locations for the dropdown
  const commonLocations = [
    "Living Room",
    "Bedroom",
    "Kitchen",
    "Bathroom",
    "Office",
    "Balcony",
    "Patio",
    "Hallway",
    "Dining Room",
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {!isEdit && (
          <FormField
            control={form.control}
            name="plantId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Plant Type</FormLabel>
                {isLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <>
                    <Select
                      disabled={isLoading}
                      onValueChange={(value) =>
                        field.onChange(parseInt(value, 10))
                      }
                      value={field.value?.toString() || ""}
                      defaultValue={field.value?.toString() || ""}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Select a plant from our catalog" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {plants?.map((plant) => (
                          <SelectItem
                            key={plant.id}
                            value={plant.id.toString()}
                          >
                            {plant.name} ({plant.botanicalName})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the type of plant from our catalog
                    </FormDescription>
                    <FormMessage />
                  </>
                )}
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="nickname"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nickname</FormLabel>
              <FormControl>
                <Input placeholder="What do you call this plant?" {...field} />
              </FormControl>
              <FormDescription>Give your plant a personal name</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <Select
                disabled={isLoading}
                onValueChange={field.onChange}
                value={field.value}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Where is this plant located?" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {commonLocations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Where in your home is this plant kept?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="wateringFrequency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Watering Frequency (days)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  {...field}
                  onChange={(e) =>
                    field.onChange(parseInt(e.target.value, 10) || 0)
                  }
                />
              </FormControl>
              <FormDescription>
                {selectedPlant
                  ? `Recommended: ${selectedPlant.wateringFrequency} days`
                  : "How often does this plant need watering?"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image URL</FormLabel>
              <FormControl>
                <Input placeholder="URL to an image of your plant" {...field} />
              </FormControl>
              <FormDescription>
                Leave empty to use the default image for this plant type
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any special care instructions or notes..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Add any notes about this plant's care
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          {isEdit && onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="px-6 rounded-[12px]"
              disabled={isLoading}
            >
              Discard Changes
            </Button>
          )}
          <Button
            type="submit"
            className="bg-primary hover:bg-primary/90 text-white px-6 rounded-[12px]"
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : submitText}
          </Button>
        </div>
      </form>
    </Form>
  );
}
