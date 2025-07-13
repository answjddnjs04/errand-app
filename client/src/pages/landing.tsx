import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, MessageSquare, Star, Users } from "lucide-react";
import { SiKakaotalk } from "react-icons/si";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-primary text-white py-12 px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="flex items-center justify-center mb-4">
            <MapPin className="h-12 w-12" />
          </div>
          <h1 className="text-3xl font-bold mb-2">우리동네 심부름</h1>
          <p className="text-primary-foreground/90 text-lg">
            가까운 이웃과 함께하는 심부름 매칭 서비스
          </p>
        </div>
      </div>

      {/* Features */}
      <div className="flex-1 py-8 px-4">
        <div className="max-w-md mx-auto space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Card className="text-center p-4">
              <CardContent className="p-0">
                <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold text-sm">이웃 연결</h3>
                <p className="text-xs text-gray-600 mt-1">가까운 거리의 이웃들과 연결</p>
              </CardContent>
            </Card>

            <Card className="text-center p-4">
              <CardContent className="p-0">
                <MessageSquare className="h-8 w-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold text-sm">실시간 채팅</h3>
                <p className="text-xs text-gray-600 mt-1">안전하고 편리한 소통</p>
              </CardContent>
            </Card>

            <Card className="text-center p-4">
              <CardContent className="p-0">
                <Star className="h-8 w-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold text-sm">신뢰 시스템</h3>
                <p className="text-xs text-gray-600 mt-1">평점과 후기로 안전한 거래</p>
              </CardContent>
            </Card>

            <Card className="text-center p-4">
              <CardContent className="p-0">
                <MapPin className="h-8 w-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold text-sm">위치 기반</h3>
                <p className="text-xs text-gray-600 mt-1">가까운 거리의 심부름만</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">어떤 심부름이 있나요?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>편의점 생필품 구매</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>택배 및 우편물 픽업</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>음식 배달 및 픽업</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>간단한 서류 전달</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Login Button */}
      <div className="p-4 bg-white border-t">
        <div className="max-w-md mx-auto">
          <Button 
            onClick={() => window.location.href = "/api/login"}
            className="w-full py-4 text-lg font-semibold bg-primary hover:bg-primary/90 flex items-center justify-center gap-2"
          >
            <SiKakaotalk className="h-5 w-5" />
            카카오로 시작하기
          </Button>
          <p className="text-center text-sm text-gray-500 mt-4">
            Replit 계정으로 간편하게 로그인
          </p>
        </div>
      </div>
    </div>
  );
}
