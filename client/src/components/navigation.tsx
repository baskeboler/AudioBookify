import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavigationProps {
  isAuthenticated: boolean;
  user?: any;
}

export default function Navigation({ isAuthenticated, user }: NavigationProps) {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const getUserInitials = (user: any) => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.firstName) {
      return user.firstName[0].toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  const getUserName = (user: any) => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.firstName) {
      return user.firstName;
    }
    if (user?.email) {
      return user.email;
    }
    return "User";
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-primary">
                <i className="fas fa-headphones mr-2"></i>AudioBook AI
              </h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Button variant="ghost" className="text-slate-600 hover:text-slate-900">
                  Pricing
                </Button>
                <Button variant="ghost" className="text-slate-600 hover:text-slate-900">
                  Help
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg">
                      <Avatar className="w-8 h-8">
                        <AvatarImage 
                          src={user?.profileImageUrl} 
                          alt={getUserName(user)}
                        />
                        <AvatarFallback className="text-xs">
                          {getUserInitials(user)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">
                        {getUserName(user)}
                      </span>
                      <i className="fas fa-chevron-down text-xs text-slate-500"></i>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => window.location.href = "/subscribe"}>
                      <i className="fas fa-crown mr-2 text-amber-500"></i>
                      Upgrade Plan
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout}>
                      <i className="fas fa-sign-out-alt mr-2 text-slate-500"></i>
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" className="text-slate-600 hover:text-slate-900">
                  Pricing
                </Button>
                <Button variant="ghost" className="text-slate-600 hover:text-slate-900">
                  Help
                </Button>
                <Button onClick={handleLogin} className="bg-primary hover:bg-blue-600 text-white">
                  Sign In
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
