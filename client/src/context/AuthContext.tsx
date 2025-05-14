import React, { createContext, useContext, ReactNode } from "react";
import { useAuth, User } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AuthContextType {
  user: User | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  showLoginDialog: (onSuccess?: () => void) => void;
  hideLoginDialog: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { user, isLoading, isAuthenticated, login, logout, refetch } = useAuth();
  const [isLoginDialogOpen, setIsLoginDialogOpen] = React.useState(false);
  const [onLoginSuccess, setOnLoginSuccess] = React.useState<(() => void) | undefined>(undefined);

  const showLoginDialog = (onSuccess?: () => void) => {
    setIsLoginDialogOpen(true);
    if (onSuccess) {
      setOnLoginSuccess(() => onSuccess);
    }
  };

  const hideLoginDialog = () => {
    setIsLoginDialogOpen(false);
    // Reset onLoginSuccess when dialog is closed to prevent later execution
    setOnLoginSuccess(undefined);
  };

  const handleLogin = () => {
    login();
  };

  // Check if user logged in and call the success callback
  React.useEffect(() => {
    if (isAuthenticated && onLoginSuccess) {
      onLoginSuccess();
      setOnLoginSuccess(undefined);
    }
  }, [isAuthenticated, onLoginSuccess]);

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    showLoginDialog,
    hideLoginDialog,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <LoginDialog 
        isOpen={isLoginDialogOpen} 
        onOpenChange={setIsLoginDialogOpen}
        onLogin={handleLogin}
      />
    </AuthContext.Provider>
  );
}

interface LoginDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onLogin: () => void;
}

function LoginDialog({ isOpen, onOpenChange, onLogin }: LoginDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" onEscapeKeyDown={(e) => {
        // Handle ESC key to properly cancel the dialog
        onOpenChange(false);
      }}>
        <DialogHeader>
          <DialogTitle>Sign in required</DialogTitle>
          <DialogDescription>
            You need to sign in to add plants to your collection.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <p className="text-sm text-gray-500">
            Please sign in with your Replit account to create and manage your plant collection.
          </p>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            className="login-dialog-cancel"
          >
            Cancel
          </Button>
          <Button onClick={onLogin} className="bg-primary hover:bg-primary/90 text-white">
            Sign in with Replit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}