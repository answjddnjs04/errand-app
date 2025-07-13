import { useQuery } from "@tanstack/react-query";
import AppHeader from "@/components/layout/app-header";
import BottomNavigation from "@/components/layout/bottom-navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getTimeAgo } from "@/types";
import type { ChatRoomWithDetails } from "@shared/schema";

export default function Chat() {
  const { user } = useAuth();

  const { data: chatRooms, isLoading } = useQuery<ChatRoomWithDetails[]>({
    queryKey: ["/api/chat-rooms"],
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <main className="pb-20 max-w-md mx-auto">
        <div className="px-4 py-2 space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="p-4">
                <CardContent className="p-0">
                  <div className="flex items-start space-x-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : chatRooms?.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">아직 채팅방이 없어요</p>
              <p className="text-sm text-gray-400">
                심부름을 매칭하면 채팅을 시작할 수 있어요
              </p>
            </div>
          ) : (
            chatRooms?.map((chatRoom) => {
              const otherUser = chatRoom.requesterId === user?.id 
                ? chatRoom.runner 
                : chatRoom.requester;
              const lastMessage = chatRoom.messages[chatRoom.messages.length - 1];
              
              return (
                <Card key={chatRoom.id} className="p-4 cursor-pointer hover:bg-gray-50">
                  <CardContent className="p-0">
                    <div className="flex items-start space-x-3">
                      <div className="h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center">
                        {otherUser?.profileImageUrl ? (
                          <img 
                            src={otherUser.profileImageUrl} 
                            alt={otherUser.firstName || 'User'}
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-500 font-medium">
                            {(otherUser?.firstName || 'U').charAt(0)}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium text-gray-900 truncate">
                            {otherUser?.firstName || '이름 없음'}
                          </h3>
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            <span>
                              {lastMessage 
                                ? getTimeAgo(new Date(lastMessage.createdAt))
                                : getTimeAgo(new Date(chatRoom.createdAt))
                              }
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-sm font-medium text-gray-700 mb-1 truncate">
                          {chatRoom.errand.title}
                        </p>
                        
                        <p className="text-sm text-gray-500 truncate">
                          {lastMessage?.message || '채팅을 시작해보세요'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </main>

      <BottomNavigation currentTab="chat" />
    </div>
  );
}
