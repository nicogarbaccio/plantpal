import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { 
  Avatar, 
  AvatarImage, 
  AvatarFallback 
} from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useAuthContext } from "@/context/AuthContext";

export default function Header() {
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAuthenticated, login, logout } = useAuthContext();
  
  // Determine if a link is active
  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path === "/explore" && (location === "/" || location === "/explore")) return true;
    if (path === "/my-collection" && location.startsWith("/my-collection")) return true;
    return false;
  };

  const handleAddPlant = () => {
    // Will navigate directly if authenticated
    setIsMenuOpen(false);
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
            <h1 className="text-2xl font-poppins font-semibold text-charcoal cursor-pointer">PlantPal</h1>
          </Link>
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          <Link href="/explore">
            <div className={`${isActive("/explore") ? "text-primary" : "text-charcoal"} hover:text-primary transition font-poppins cursor-pointer`}>
              Explore Plants
            </div>
          </Link>
          {isAuthenticated ? (
            <Link href="/my-collection">
              <div className={`${isActive("/my-collection") ? "text-primary" : "text-charcoal"} hover:text-primary transition font-poppins cursor-pointer`}>
                My Collection
              </div>
            </Link>
          ) : (
            <div 
              className="text-charcoal hover:text-primary transition font-poppins cursor-pointer"
              onClick={login}
            >
              My Collection
            </div>
          )}
        </div>
        
        <div className="hidden md:flex items-center space-x-3">
          {isAuthenticated ? (
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
          ) : (
            <Button 
              className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-[12px] font-poppins"
              onClick={login}
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
          )}

          {/* User menu or login button */}
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="h-8 w-8 cursor-pointer">
                  {user?.profileImageUrl ? (
                    <AvatarImage src={user.profileImageUrl} alt={user.username} />
                  ) : (
                    <AvatarFallback className="bg-primary text-white">
                      {user?.firstName?.[0] || user?.username?.[0] || 'U'}
                    </AvatarFallback>
                  )}
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex flex-col space-y-1 p-2">
                  <p className="text-sm font-medium leading-none">{user?.username}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-4 w-4 mr-2" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" onClick={login} className="font-poppins">
              Sign in
            </Button>
          )}
        </div>
        
        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-charcoal text-xl">
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
                {isAuthenticated && user && (
                  <div className="flex items-center space-x-3 mb-3">
                    <Avatar className="h-10 w-10">
                      {user.profileImageUrl ? (
                        <AvatarImage src={user.profileImageUrl} alt={user.username} />
                      ) : (
                        <AvatarFallback className="bg-primary text-white">
                          {user.firstName?.[0] || user.username[0]}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.username}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                )}
                
                <Link href="/explore">
                  <div 
                    className={`${isActive("/explore") ? "text-primary" : "text-charcoal"} hover:text-primary transition font-poppins text-lg cursor-pointer`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Explore Plants
                  </div>
                </Link>
                {isAuthenticated ? (
                  <Link href="/my-collection">
                    <div 
                      className={`${isActive("/my-collection") ? "text-primary" : "text-charcoal"} hover:text-primary transition font-poppins text-lg cursor-pointer`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      My Collection
                    </div>
                  </Link>
                ) : (
                  <div 
                    className="text-charcoal hover:text-primary transition font-poppins text-lg cursor-pointer"
                    onClick={() => {
                      login();
                      setIsMenuOpen(false);
                    }}
                  >
                    My Collection
                  </div>
                )}
                
                {isAuthenticated ? (
                  <Link href="/my-collection/add">
                    <Button 
                      className="bg-primary hover:bg-primary/90 text-white w-full mt-4 rounded-[12px] font-poppins"
                      onClick={handleAddPlant}
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
                ) : (
                  <Button 
                    className="bg-primary hover:bg-primary/90 text-white w-full mt-4 rounded-[12px] font-poppins"
                    onClick={() => {
                      login();
                      setIsMenuOpen(false);
                    }}
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
                )}
                
                {/* Login/Logout button */}
                {isAuthenticated ? (
                  <Button 
                    variant="outline" 
                    className="w-full mt-2 font-poppins" 
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
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
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16 17 21 12 16 7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    Sign out
                  </Button>
                ) : (
                  <Button 
                    className="w-full mt-2 font-poppins" 
                    variant="outline" 
                    onClick={() => {
                      login();
                      setIsMenuOpen(false);
                    }}
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
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                      <polyline points="10 17 15 12 10 7"></polyline>
                      <line x1="15" y1="12" x2="3" y2="12"></line>
                    </svg>
                    Sign in
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
