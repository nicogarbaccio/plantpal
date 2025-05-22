import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuthStore } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";

export default function Header() {
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const { user, token, clearAuth } = useAuthStore();
  const isSignedIn = !!token;

  // Handle sign out flow
  const initiateSignOut = () => {
    setShowSignOutDialog(true);
  };

  const confirmSignOut = () => {
    clearAuth();
    setShowSignOutDialog(false);
    setIsMenuOpen(false);
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
  };

  // Determine if a link is active
  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path === "/explore" && (location === "/" || location === "/explore"))
      return true;
    if (path === "/my-collection" && location.startsWith("/my-collection"))
      return true;
    return false;
  };

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-primary mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
          <Link href="/">
            <h1 className="text-2xl font-poppins font-semibold text-charcoal cursor-pointer">
              PlantPal
            </h1>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          <Link href="/explore">
            <a
              className={`${
                isActive("/explore") ? "text-primary" : "text-charcoal"
              } hover:text-primary transition font-poppins`}
            >
              Explore Plants
            </a>
          </Link>
          {isSignedIn && (
            <Link href="/my-collection">
              <a
                className={`${
                  isActive("/my-collection") ? "text-primary" : "text-charcoal"
                } hover:text-primary transition font-poppins`}
              >
                My Collection
              </a>
            </Link>
          )}
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center space-x-4">
          {isSignedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity">
                  <AvatarFallback>
                    {user?.username[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <Link href="/account">
                  <DropdownMenuItem className="cursor-pointer">
                    Account
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuItem
                  onClick={initiateSignOut}
                  className="cursor-pointer"
                >
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/signin">
              <Button
                variant="ghost"
                className="text-charcoal hover:text-primary"
              >
                Sign in
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-charcoal text-xl"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[300px]">
              <div className="flex items-center mb-8">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-primary mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
                <h2 className="text-2xl font-poppins font-semibold text-charcoal">
                  PlantPal
                </h2>
              </div>
              <div className="flex flex-col space-y-6">
                <Link href="/explore">
                  <a
                    className={`${
                      isActive("/explore") ? "text-primary" : "text-charcoal"
                    } hover:text-primary transition font-poppins text-lg`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Explore Plants
                  </a>
                </Link>
                {isSignedIn && (
                  <Link href="/my-collection">
                    <a
                      className={`${
                        isActive("/my-collection")
                          ? "text-primary"
                          : "text-charcoal"
                      } hover:text-primary transition font-poppins text-lg`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      My Collection
                    </a>
                  </Link>
                )}
                {isSignedIn ? (
                  <div className="flex flex-col space-y-4 pt-4 border-t border-gray-200">
                    <Link href="/account">
                      <a
                        className="text-charcoal hover:text-primary transition font-poppins text-lg"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Account Settings
                      </a>
                    </Link>
                    <a
                      className="text-red-600 hover:text-red-700 transition font-poppins text-lg cursor-pointer"
                      onClick={initiateSignOut}
                    >
                      Sign Out
                    </a>
                  </div>
                ) : (
                  <Link href="/signin">
                    <Button
                      variant="ghost"
                      className="text-charcoal hover:text-primary w-full justify-start px-0"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Sign in
                    </Button>
                  </Link>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Sign Out Confirmation Dialog */}
      <AlertDialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to sign out?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You will need to sign in again to access your plant collection.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSignOut}>
              Yes, sign out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
}
