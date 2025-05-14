import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plant, Wishlist } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import ProtectedRoute from "@/components/protected-route";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Heart, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function WishlistPage() {
  const { toast } = useToast();
  
  // Fetch wishlist
  const { data: wishlistItems, isLoading } = useQuery<(Wishlist & { plant: Plant })[]>({
    queryKey: ["/api/wishlist"],
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 30000 // 30 seconds
  });
  
  // Remove from wishlist mutation
  const removeFromWishlist = async (plantId: number) => {
    try {
      await apiRequest({
        url: `/api/wishlist/${plantId}`,
        method: 'DELETE',
        body: {}
      });
      
      // Invalidate cache
      queryClient.invalidateQueries({
        queryKey: ['/api/wishlist'],
        exact: false
      });
      
      toast({
        title: "Success",
        description: "Plant removed from wishlist",
      });
    } catch (error) {
      console.error("Failed to remove from wishlist:", error);
      toast({
        title: "Error",
        description: "Failed to remove from wishlist",
        variant: "destructive",
      });
    }
  };
  
  return (
    <ProtectedRoute>
      <div className="container py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Wishlist</h1>
            <p className="text-muted-foreground">Plants you're interested in adding to your collection</p>
          </div>
          <Link to="/explore">
            <Button>Explore More Plants</Button>
          </Link>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : wishlistItems?.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">Your wishlist is empty</h2>
            <p className="text-muted-foreground mb-6">
              Explore our plant catalog and add plants you're interested in to your wishlist
            </p>
            <Link to="/explore">
              <Button>Explore Plants</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlistItems?.map((item) => (
              <Card key={item.id} className="overflow-hidden flex flex-col h-full">
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={item.plant.imageUrl || '/placeholder-plant.jpg'} 
                    alt={item.plant.name}
                    className="w-full h-full object-cover transition-transform hover:scale-105"
                  />
                  <div className="absolute top-3 right-3">
                    <Badge variant="secondary" className="font-medium">
                      {item.plant.difficulty}
                    </Badge>
                  </div>
                </div>
                
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl">{item.plant.name}</CardTitle>
                  <p className="text-sm text-muted-foreground italic">{item.plant.botanicalName}</p>
                </CardHeader>
                
                <CardContent className="flex-grow">
                  <p className="line-clamp-3 text-sm text-muted-foreground">
                    {item.plant.description}
                  </p>
                  <div className="flex mt-3 gap-2 flex-wrap">
                    <Badge variant="outline" className="bg-green-50">
                      {item.plant.category}
                    </Badge>
                    <Badge variant="outline" className="bg-blue-50">
                      {item.plant.lightRequirements}
                    </Badge>
                    <Badge variant="outline" className="bg-amber-50">
                      Water every {item.plant.wateringFrequency} days
                    </Badge>
                  </div>
                </CardContent>
                
                <CardFooter className="flex justify-between gap-2 pt-2">
                  <Link to={`/plants/${item.plant.id}`}>
                    <Button variant="secondary" className="w-full">View Details</Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => removeFromWishlist(item.plant.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}