import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Header from "@/components/layout/header";
import Explore from "@/pages/explore";
import MyCollection from "@/pages/my-collection";
import PlantDetail from "@/pages/plant-detail";
import AddPlant from "@/pages/add-plant";
import SignIn from "@/pages/signin";
import SignUp from "@/pages/signup";
import AuthGuard from "@/components/auth-guard";
import { useState } from "react";

function Router() {
  // TODO: Replace with real auth state management
  const [isSignedIn] = useState(false);

  return (
    <Switch>
      <Route path="/" component={Explore} />
      <Route path="/explore" component={Explore} />
      <Route path="/my-collection">
        {() => (
          <AuthGuard isSignedIn={isSignedIn}>
            <MyCollection />
          </AuthGuard>
        )}
      </Route>
      <Route path="/plants/:id" component={PlantDetail} />
      <Route path="/my-collection/add">
        {() => (
          <AuthGuard isSignedIn={isSignedIn}>
            <AddPlant />
          </AuthGuard>
        )}
      </Route>
      <Route path="/my-collection/:id">
        {() => (
          <AuthGuard isSignedIn={isSignedIn}>
            <PlantDetail />
          </AuthGuard>
        )}
      </Route>
      <Route path="/signin" component={SignIn} />
      <Route path="/signup" component={SignUp} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-grow">
            <Router />
          </main>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
