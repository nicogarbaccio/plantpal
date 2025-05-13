import { Link } from "wouter";
import { Plant } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import WishlistButton from "@/components/wishlist-button";

interface PlantCardProps {
  plant: Plant;
}

export default function PlantCard({ plant }: PlantCardProps) {
  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // The WishlistButton handles the wishlist logic internally
  };
  
  return (
    <Link href={`/plants/${plant.id}`}>
      <Card className="plant-card bg-white rounded-[12px] overflow-hidden shadow-md cursor-pointer">
        <div className="relative h-56">
          <img 
            src={plant.imageUrl} 
            alt={plant.name} 
            className="w-full h-full object-cover"
          />
          <div 
            className="absolute top-3 right-3 z-10 flex items-center justify-center"
            onClick={handleWishlistClick}
          >
            <div className="bg-white p-2 rounded-full shadow-md">
              <WishlistButton plantId={plant.id} size="icon" variant="ghost" />
            </div>
          </div>
        </div>
        <CardContent className="p-4">
          <h4 className="font-poppins font-medium text-lg mb-1">{plant.name}</h4>
          <p className="text-gray-500 text-sm font-lato italic mb-3">{plant.botanicalName}</p>
          
          <div className="flex justify-between mb-4">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              <span className="text-sm font-lato">
                {plant.wateringFrequency === 7 
                  ? "Weekly" 
                  : plant.wateringFrequency === 14 
                    ? "Bi-weekly" 
                    : plant.wateringFrequency === 30 
                      ? "Monthly" 
                      : `Every ${plant.wateringFrequency} days`}
              </span>
            </div>
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span className="text-sm font-lato">{plant.lightRequirements}</span>
            </div>
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
              </svg>
              <span className="text-sm font-lato">{plant.difficulty}</span>
            </div>
          </div>
          
          <Button variant="outline" className="w-full bg-accent hover:bg-gray-200 text-charcoal font-poppins py-2 rounded-[12px] transition">
            View Details
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
}
