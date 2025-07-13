import { Link, useLocation } from "wouter";
import { Home, List, MessageSquare, User } from "lucide-react";

interface BottomNavigationProps {
  currentTab: 'home' | 'my-errands' | 'chat' | 'profile';
}

export default function BottomNavigation({ currentTab }: BottomNavigationProps) {
  const [location] = useLocation();

  const navItems = [
    { key: 'home', icon: Home, label: '홈', path: '/' },
    { key: 'my-errands', icon: List, label: '내 심부름', path: '/my-errands' },
    { key: 'chat', icon: MessageSquare, label: '채팅', path: '/chat' },
    { key: 'profile', icon: User, label: '프로필', path: '/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom z-50">
      <div className="max-w-md mx-auto">
        <div className="flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.key;
            
            return (
              <Link
                key={item.key}
                href={item.path}
                className={`flex-1 py-2 px-4 flex flex-col items-center space-y-1 ${
                  isActive ? 'text-primary' : 'text-gray-400'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.label}</span>
                {item.key === 'chat' && (
                  <div className="absolute top-1 right-3 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
