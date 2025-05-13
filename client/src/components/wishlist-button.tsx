import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/context/AuthContext";

interface WishlistButtonProps {
  plantId: number;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  showText?: boolean;
}

export default function WishlistButton({ 
  plantId, 
  variant = "outline", 
  size = "icon",
  showText = false 
}: WishlistButtonProps) {
  const { isAuthenticated, showLoginDialog } = useAuthContext();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Check if plant is in wishlist
  const { data, isLoading } = useQuery<{ isInWishlist: boolean }>({
    queryKey: ['/api/wishlist/check', plantId],
    enabled: isAuthenticated,
    retry: false
  });
  
  const isInWishlist = data?.isInWishlist || false;
  
  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      showLoginDialog(() => {
        // After login, we'll refresh the wishlist status
        queryClient.invalidateQueries({ queryKey: ['/api/wishlist/check', plantId] });
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      if (isInWishlist) {
        // Remove from wishlist
        await apiRequest({
          url: `/api/wishlist/${plantId}`,
          method: 'DELETE'
        });
        
        toast({
          title: "Removed from wishlist",
          description: "Plant was removed from your wishlist"
        });
      } else {
        // Add to wishlist
        await apiRequest({
          url: `/api/wishlist/${plantId}`,
          method: 'POST'
        });
        
        toast({
          title: "Added to wishlist",
          description: "Plant was added to your wishlist"
        });
      }
      
      // Invalidate cached data
      queryClient.invalidateQueries({ queryKey: ['/api/wishlist'] });
      queryClient.invalidateQueries({ queryKey: ['/api/wishlist/check', plantId] });
      
    } catch (error) {
      console.error("Error toggling wishlist:", error);
      toast({
        title: "Error",
        description: "Failed to update wishlist",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <Button
      variant={variant}
      size={size}
      disabled={isLoading || isProcessing}
      onClick={handleToggleWishlist}
      className={isInWishlist ? "text-red-500 hover:text-red-700" : undefined}
    >
      <Heart className={`${isInWishlist ? "fill-current" : ""} h-4 w-4 mr-2`} />
      {showText && (isInWishlist ? "Remove from Wishlist" : "Add to Wishlist")}
    </Button>
  );
}