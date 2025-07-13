export interface UrgencyLevel {
  key: 'normal' | 'urgent' | 'super-urgent';
  label: string;
  price: number;
  colorClass: string;
}

export const URGENCY_LEVELS: UrgencyLevel[] = [
  {
    key: 'normal',
    label: '일반',
    price: 0,
    colorClass: 'urgency-normal'
  },
  {
    key: 'urgent',
    label: '긴급',
    price: 1000,
    colorClass: 'urgency-urgent'
  },
  {
    key: 'super-urgent',
    label: '초긴급',
    price: 2000,
    colorClass: 'urgency-super-urgent'
  }
];

export const BASE_PRICE = 3000;

export function calculateTotalPrice(urgency: string, tip: number = 0): number {
  const urgencyLevel = URGENCY_LEVELS.find(level => level.key === urgency);
  const urgencyPrice = urgencyLevel?.price || 0;
  return BASE_PRICE + urgencyPrice + tip;
}

export function formatPrice(price: number): string {
  return `${price.toLocaleString()}원`;
}

export function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  
  if (diffInMinutes < 1) return '방금 전';
  if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}시간 전`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}일 전`;
}
