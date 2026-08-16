export interface LiqPayCallbackData {
  order_id: string;
  payment_id: number;
  action: string;
  status: string;
  amount: number;
  currency: string;
  description: string;
  create_date: number;
  end_date: number;
  transaction_id: number;
  sender_card_mask2: string;
  subscription_id?: string;
  err_code?: string;
  err_description?: string;
}
