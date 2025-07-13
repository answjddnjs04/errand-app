import { useAuth } from "@/hooks/useAuth";
import { MapPin, Search, Bell, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppHeader() {
  const { user } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50">
      <div className="flex items-center justify-between max-w-md mx-auto">
        <div className="flex items-center space-x-2">
          <MapPin className="h-5 w-5 text-primary" />
          <span className="font-medium text-gray-900">
            {user?.location || '성수동'}
          </span>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" className="touch-target p-2">
            <Search className="h-5 w-5 text-gray-600" />
          </Button>
          <Button variant="ghost" size="sm" className="touch-target p-2">
            <Bell className="h-5 w-5 text-gray-600" />
          </Button>
        </div>
      </div>
    </header>
  );
}
