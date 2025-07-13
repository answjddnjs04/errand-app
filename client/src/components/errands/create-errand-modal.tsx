import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { X, MapPin } from "lucide-react";
import { URGENCY_LEVELS, calculateTotalPrice, formatPrice } from "@/types";
import { insertErrandSchema } from "@shared/schema";

interface CreateErrandModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const formSchema = insertErrandSchema.extend({
  tip: z.number().min(0, "팁은 0원 이상이어야 합니다"),
});

type FormData = z.infer<typeof formSchema>;

export default function CreateErrandModal({ isOpen, onClose }: CreateErrandModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUrgency, setSelectedUrgency] = useState<string>('normal');

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      startLocationAddress: "",
      endLocationAddress: "",
      urgency: "normal",
      tip: 0,
      estimatedDistance: 500,
      estimatedTime: 10,
    },
  });

  const createErrandMutation = useMutation({
    mutationFn: async (data: FormData) => {
      await apiRequest("POST", "/api/errands", data);
    },
    onSuccess: () => {
      toast({
        title: "심부름 등록 완료",
        description: "심부름이 성공적으로 등록되었습니다.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/errands"] });
      form.reset();
      onClose();
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
        description: "심부름 등록에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    createErrandMutation.mutate({
      ...data,
      urgency: selectedUrgency,
    });
  };

  const watchedTip = form.watch("tip");
  const calculatedReward = calculateTotalPrice(selectedUrgency, watchedTip || 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">심부름 등록</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2 text-gray-400"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="title">제목</Label>
            <Input
              id="title"
              placeholder="어떤 심부름인가요?"
              {...form.register("title")}
            />
            {form.formState.errors.title && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">상세 설명</Label>
            <Textarea
              id="description"
              placeholder="자세한 내용을 알려주세요"
              rows={3}
              {...form.register("description")}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.description.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="startLocation">출발지</Label>
            <div className="relative">
              <Input
                id="startLocation"
                placeholder="출발지를 입력해주세요"
                {...form.register("startLocationAddress")}
                className="pr-10"
              />
              <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>

          <div>
            <Label htmlFor="endLocation">도착지</Label>
            <div className="relative">
              <Input
                id="endLocation"
                placeholder="도착지를 입력해주세요"
                {...form.register("endLocationAddress")}
                className="pr-10"
              />
              <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>

          <div>
            <Label>긴급도</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {URGENCY_LEVELS.map((urgency) => (
                <Button
                  key={urgency.key}
                  type="button"
                  variant={selectedUrgency === urgency.key ? "default" : "outline"}
                  className={`py-3 text-center ${urgency.colorClass} ${
                    selectedUrgency === urgency.key ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedUrgency(urgency.key)}
                >
                  <div>
                    <div className="font-medium">{urgency.label}</div>
                    <div className="text-xs">+{urgency.price.toLocaleString()}원</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="tip">추가 팁</Label>
            <Input
              id="tip"
              type="number"
              placeholder="0"
              min="0"
              {...form.register("tip", { valueAsNumber: true })}
            />
            {form.formState.errors.tip && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.tip.message}</p>
            )}
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700">예상 심부름비</span>
              <span className="text-xl font-bold text-primary">
                {formatPrice(calculatedReward)}
              </span>
            </div>
            <div className="text-sm text-gray-500 mt-1">
              기본 3,000원 + 긴급도 + 팁
            </div>
          </div>

          <Button
            type="submit"
            disabled={createErrandMutation.isPending}
            className="w-full py-4 bg-primary hover:bg-primary/90 font-semibold"
          >
            {createErrandMutation.isPending ? "등록 중..." : "심부름 등록하기"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
