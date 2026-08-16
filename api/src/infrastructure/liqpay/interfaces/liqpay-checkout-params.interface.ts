export interface LiqPayCheckoutParams {
  orderId: string;
  amount: number;
  currency: string;
  description: string;
  action: 'subscribe' | 'pay';
  subscribePeriodicity?: 'month' | 'year';
  subscribeDateStart?: string;
  resultUrl?: string;
}
