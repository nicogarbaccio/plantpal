import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Header() {
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // TODO: Replace with real auth
  const [isSignedIn] = useState(false);
  const mockUser = { name: "John Doe" };

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
          <Link href="/my-collection">
            <a
              className={`${
                isActive("/my-collection") ? "text-primary" : "text-charcoal"
              } hover:text-primary transition font-poppins`}
            >
              My Collection
            </a>
          </Link>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center space-x-4">
          <Link href="/my-collection/add">
            <Button className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-[12px] font-poppins">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Add Plant
            </Button>
          </Link>
          {isSignedIn ? (
            <Avatar className="h-8 w-8">
              <AvatarFallback>{mockUser.name[0]}</AvatarFallback>
            </Avatar>
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
            <SheetContent>
              <div className="flex flex-col space-y-4 mt-8">
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
                {isSignedIn ? (
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{mockUser.name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-charcoal font-poppins">
                      {mockUser.name}
                    </span>
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
                <Link href="/my-collection/add">
                  <Button
                    className="bg-primary hover:bg-primary/90 text-white w-full mt-4 rounded-[12px] font-poppins"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Add Plant
                  </Button>
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
