import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import Explore from "@/pages/explore";
import MyCollection from "@/pages/my-collection";
import PlantDetail from "@/pages/plant-detail";
import AddPlant from "@/pages/add-plant";
import WishlistPage from "@/pages/wishlist";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Explore} />
      <Route path="/explore" component={Explore} />
      <Route path="/plants/:id" component={PlantDetail} />
      
      {/* Protected routes */}
      <Route path="/my-collection">
        {(params) => (
          <ProtectedRoute>
            <MyCollection />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/my-collection/add">
        {(params) => (
          <ProtectedRoute>
            <AddPlant />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/my-collection/:id">
        {(params) => (
          <ProtectedRoute>
            <PlantDetail />
          </ProtectedRoute>
        )}
      </Route>
      
      {/* Wishlist route */}
      <Route path="/wishlist">
        {() => (
          <ProtectedRoute>
            <WishlistPage />
          </ProtectedRoute>
        )}
      </Route>
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-grow">
              <Router />
            </main>
            <Footer />
          </div>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
