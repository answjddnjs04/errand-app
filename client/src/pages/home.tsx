import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AppHeader from "@/components/layout/app-header";
import BottomNavigation from "@/components/layout/bottom-navigation";
import ErrandCard from "@/components/errands/errand-card";
import CreateErrandModal from "@/components/errands/create-errand-modal";
import FloatingActionButton from "@/components/ui/floating-action-button";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import type { ErrandWithUser } from "@shared/schema";

export default function Home() {
  const { user } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");

  const { data: errands, isLoading } = useQuery<ErrandWithUser[]>({
    queryKey: ["/api/errands"],
  });

  const filterButtons = [
    { key: "all", label: "전체" },
    { key: "urgent", label: "긴급" },
    { key: "nearby", label: "가까운 순" },
    { key: "high-tip", label: "높은 팁" },
  ];

  const filteredErrands = errands?.filter(errand => {
    if (activeFilter === "all") return true;
    if (activeFilter === "urgent") return errand.urgency === "urgent" || errand.urgency === "super-urgent";
    // TODO: Implement other filters with location data
    return true;
  }) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <main className="pb-20 max-w-md mx-auto">
        {/* Filter Section */}
        <div className="bg-white px-4 py-3 border-b border-gray-100">
          <div className="flex items-center space-x-2 overflow-x-auto">
            {filterButtons.map((filter) => (
              <Button
                key={filter.key}
                variant={activeFilter === filter.key ? "default" : "secondary"}
                size="sm"
                className={`flex-shrink-0 rounded-full text-sm font-medium ${
                  activeFilter === filter.key 
                    ? "bg-primary-orange hover:bg-primary-dark text-white" 
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                onClick={() => setActiveFilter(filter.key)}
              >
                {filter.label}
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
          ) : filteredErrands.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">아직 등록된 심부름이 없어요</p>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-primary-orange hover:bg-primary-dark"
              >
                첫 심부름 등록하기
              </Button>
            </div>
          ) : (
            filteredErrands.map((errand) => (
              <ErrandCard key={errand.id} errand={errand} />
            ))
          )}
        </div>

        {/* Load More Button */}
        {filteredErrands.length > 0 && (
          <div className="px-4 py-4">
            <Button 
              variant="secondary" 
              className="w-full py-3 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200"
            >
              더 많은 심부름 보기
            </Button>
          </div>
        )}
      </main>

      <FloatingActionButton 
        onClick={() => setIsCreateModalOpen(true)}
      />
      
      <BottomNavigation currentTab="home" />

      <CreateErrandModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
