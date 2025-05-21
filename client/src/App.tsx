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
import EditPlant from "@/pages/edit-plant";
import SignIn from "@/pages/signin";
import SignUp from "@/pages/signup";
import Account from "@/pages/account";
import AuthGuard from "@/components/auth-guard";
import { useAuthStore } from "@/lib/auth";
import { useState } from "react";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Explore} />
      <Route path="/explore" component={Explore} />
      <Route path="/my-collection">
        {() => (
          <AuthGuard>
            <MyCollection />
          </AuthGuard>
        )}
      </Route>
      <Route path="/plants/:id" component={PlantDetail} />
      <Route path="/my-collection/add">
        {() => (
          <AuthGuard>
            <AddPlant />
          </AuthGuard>
        )}
      </Route>
      <Route path="/account">
        {() => (
          <AuthGuard>
            <Account />
          </AuthGuard>
        )}
      </Route>
      <Route path="/my-collection/edit/:id">
        {() => (
          <AuthGuard>
            <EditPlant />
          </AuthGuard>
        )}
      </Route>
      <Route path="/my-collection/:id">
        {() => (
          <AuthGuard>
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
