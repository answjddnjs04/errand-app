import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import { MapPin, Clock } from "lucide-react";
import { URGENCY_LEVELS, calculateTotalPrice, formatPrice, getTimeAgo } from "@/types";
import type { ErrandWithUser } from "@shared/schema";

interface ErrandCardProps {
  errand: ErrandWithUser;
  showStatus?: boolean;
}

export default function ErrandCard({ errand, showStatus = false }: ErrandCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const urgencyLevel = URGENCY_LEVELS.find(level => level.key === errand.urgency);
  const totalPrice = calculateTotalPrice(errand.urgency, errand.tip);

  const acceptErrandMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/errands/${errand.id}/accept`, {});
    },
    onSuccess: () => {
      toast({
        title: "심부름 수락 완료",
        description: "채팅을 시작해보세요!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/errands"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-errands"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "로그인 필요",
          description: "다시 로그인해주세요.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "오류",
        description: "심부름 수락에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleAccept = () => {
    acceptErrandMutation.mutate();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'text-gray-600';
      case 'matched': return 'text-blue-600';
      case 'in-progress': return 'text-yellow-600';
      case 'completed': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'waiting': return '대기중';
      case 'matched': return '매칭됨';
      case 'in-progress': return '진행중';
      case 'completed': return '완료';
      default: return status;
    }
  };

  const canAccept = errand.status === 'waiting' && errand.requesterId !== user?.id;

  return (
    <Card className="card-shadow border border-gray-100 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${urgencyLevel?.colorClass}`}>
                {urgencyLevel?.label}
              </span>
              <span className="text-xs text-gray-500">
                {getTimeAgo(new Date(errand.createdAt))}
              </span>
              {showStatus && (
                <span className={`text-xs font-medium ${getStatusColor(errand.status)}`}>
                  {getStatusText(errand.status)}
                </span>
              )}
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{errand.title}</h3>
            <p className="text-sm text-gray-600 line-clamp-2">{errand.description}</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                {errand.estimatedDistance ? `${errand.estimatedDistance}m` : '계산중'}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                {errand.estimatedTime ? `${errand.estimatedTime}분` : '계산중'}
              </span>
            </div>
          </div>
          
          <div className="text-right">
            <div className="font-bold text-primary text-lg">
              {formatPrice(totalPrice)}
            </div>
            <div className="text-xs text-gray-500">
              기본 3천 + 
              {urgencyLevel?.price ? ` ${urgencyLevel.label} ${urgencyLevel.price.toLocaleString()}원 +` : ''} 
              {errand.tip ? ` 팁 ${errand.tip.toLocaleString()}원` : ''}
            </div>
          </div>
        </div>

        {canAccept && (
          <div className="mt-4">
            <Button
              onClick={handleAccept}
              disabled={acceptErrandMutation.isPending}
              className="w-full bg-primary-orange hover:bg-primary-dark"
            >
              {acceptErrandMutation.isPending ? "수락 중..." : "이 심부름 하기"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
