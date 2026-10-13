export interface OrderDetails {
  order_id: string;
  amount: number;
  currency: string;
  customer_name: string;
  customer_email: string;
  order_key?: string;
  timestamp?: number;
  signature?: string;
  return_url?: string;
}

export type PaymentStatus =
  | 'idle'
  | 'validating'
  | 'ready'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'signature_error';

export interface AppConfig {
  publishableKey: string;
  storeDomain: string;
  isLive: boolean;
  isConfigured: boolean;
}

export interface WebhookSimulationLog {
  id: string;
  timestamp: string;
  event: string;
  orderId: string;
  status: 'received' | 'forwarded_to_wc' | 'failed';
  details: string;
}
