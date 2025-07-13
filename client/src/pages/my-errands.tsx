import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AppHeader from "@/components/layout/app-header";
import BottomNavigation from "@/components/layout/bottom-navigation";
import ErrandCard from "@/components/errands/errand-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import type { ErrandWithUser } from "@shared/schema";

export default function MyErrands() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'requested' | 'accepted'>('requested');

  const { data: errands, isLoading } = useQuery<ErrandWithUser[]>({
    queryKey: ["/api/my-errands", { type: activeTab }],
  });

  const tabs = [
    { key: 'requested' as const, label: '요청한 심부름' },
    { key: 'accepted' as const, label: '수락한 심부름' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <main className="pb-20 max-w-md mx-auto">
        {/* Tab Navigation */}
        <div className="bg-white border-b border-gray-100">
          <div className="flex">
            {tabs.map((tab) => (
              <Button
                key={tab.key}
                variant="ghost"
                className={`flex-1 py-4 rounded-none border-b-2 ${
                  activeTab === tab.key
                    ? "border-primary text-primary font-medium"
                    : "border-transparent text-gray-600"
                }`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Errand List */}
        <div className="px-4 py-2 space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-4 border border-gray-100">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-5 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-4" />
                <div className="flex justify-between">
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
            ))
          ) : errands?.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-2">
                {activeTab === 'requested' 
                  ? '아직 요청한 심부름이 없어요' 
                  : '아직 수락한 심부름이 없어요'
                }
              </p>
              <p className="text-sm text-gray-400">
                {activeTab === 'requested' 
                  ? '필요한 심부름을 등록해보세요' 
                  : '홈에서 심부름을 찾아보세요'
                }
              </p>
            </div>
          ) : (
            errands?.map((errand) => (
              <ErrandCard 
                key={errand.id} 
                errand={errand} 
                showStatus={true}
              />
            ))
          )}
        </div>
      </main>

      <BottomNavigation currentTab="my-errands" />
    </div>
  );
}
