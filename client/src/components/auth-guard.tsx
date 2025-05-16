import { ReactNode } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AuthGuardProps {
  children: ReactNode;
  isSignedIn: boolean;
}

export default function AuthGuard({ children, isSignedIn }: AuthGuardProps) {
  const [, setLocation] = useLocation();

  if (!isSignedIn) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Sign in Required
            </h2>
            <p className="text-gray-600 mb-6">
              Please sign in to view and manage your plant collection.
            </p>
            <Button
              onClick={() => setLocation("/signin")}
              className="bg-primary hover:bg-primary/90"
            >
              Sign in
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
