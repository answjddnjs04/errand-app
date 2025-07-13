import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import AppHeader from "@/components/layout/app-header";
import BottomNavigation from "@/components/layout/bottom-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import { Star, MapPin, Award, LogOut } from "lucide-react";

export default function Profile() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    location: user?.location || '',
    maxDistance: user?.maxDistance || 2000,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { location: string; maxDistance: number }) => {
      await apiRequest("PATCH", "/api/profile", data);
    },
    onSuccess: () => {
      toast({
        title: "프로필 업데이트 완료",
        description: "프로필이 성공적으로 업데이트되었습니다.",
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "인증 오류",
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
        description: "프로필 업데이트에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateProfileMutation.mutate(formData);
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <main className="pb-20 max-w-md mx-auto px-4 py-4">
          <Card className="mb-4">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <main className="pb-20 max-w-md mx-auto px-4 py-4">
        {/* Profile Header */}
        <Card className="mb-4">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center">
                {user?.profileImageUrl ? (
                  <img 
                    src={user.profileImageUrl} 
                    alt={user.firstName || 'User'}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-2xl text-gray-500 font-medium">
                    {(user?.firstName || 'U').charAt(0)}
                  </span>
                )}
              </div>
              
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">
                  {user?.firstName || '이름 없음'}
                </h2>
                <p className="text-gray-600">{user?.email}</p>
                
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium">{user?.rating || '5.00'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Award className="h-4 w-4 text-primary" />
                    <span className="text-sm">{user?.completedErrands || 0}건 완료</span>
                  </div>
                </div>
              </div>
            </div>
            
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? '편집 취소' : '프로필 편집'}
            </Button>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>위치 설정</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="location">현재 위치</Label>
              {isEditing ? (
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="예: 성수동"
                />
              ) : (
                <p className="mt-1 text-gray-900">{user?.location || '미설정'}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="maxDistance">최대 활동 반경</Label>
              {isEditing ? (
                <div className="flex items-center space-x-2 mt-1">
                  <Input
                    id="maxDistance"
                    type="number"
                    value={formData.maxDistance}
                    onChange={(e) => setFormData({ ...formData, maxDistance: parseInt(e.target.value) })}
                    min="500"
                    max="5000"
                    step="500"
                  />
                  <span className="text-sm text-gray-500">미터</span>
                </div>
              ) : (
                <p className="mt-1 text-gray-900">{(user?.maxDistance || 2000) / 1000}km</p>
              )}
            </div>
            
            {isEditing && (
              <div className="flex space-x-2">
                <Button
                  onClick={handleSave}
                  disabled={updateProfileMutation.isPending}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  {updateProfileMutation.isPending ? "저장 중..." : "저장"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  className="flex-1"
                >
                  취소
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card>
          <CardContent className="p-4">
            <Button
              variant="outline"
              className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              로그아웃
            </Button>
          </CardContent>
        </Card>
      </main>

      <BottomNavigation currentTab="profile" />
    </div>
  );
}
