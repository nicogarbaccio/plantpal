import { useState } from "react";
import { Button } from "@/components/ui/button";

interface PlantGalleryProps {
  mainImage?: string;
  additionalImages?: string[];
  plantName: string;
}

export default function PlantGallery({ mainImage, additionalImages = [], plantName }: PlantGalleryProps) {
  const [activeImage, setActiveImage] = useState(mainImage);
  
  // Fallback image if no images provided
  const defaultImage = "https://images.unsplash.com/photo-1592150621744-aca64f48394a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=600&q=80";
  
  // Combine main image with additional images
  const allImages = mainImage 
    ? [mainImage, ...additionalImages.filter(img => img !== mainImage)]
    : additionalImages.length > 0 
      ? additionalImages
      : [defaultImage];
  
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-[12px] overflow-hidden shadow-md">
        <img 
          src={activeImage || allImages[0]} 
          alt={plantName}
          className="w-full h-[400px] object-cover"
        />
      </div>
      
      {allImages.length > 1 && (
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {allImages.map((img, index) => (
            <Button
              key={`thumb-${index}`}
              variant="outline"
              className={`p-0 h-20 w-20 rounded-[12px] overflow-hidden flex-shrink-0 ${activeImage === img ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setActiveImage(img)}
            >
              <img 
                src={img} 
                alt={`${plantName} thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
