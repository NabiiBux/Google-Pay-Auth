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
  sku?: string;
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
  googlePayMerchantId?: string;
  googlePayMerchantName?: string;
  googlePayEnv?: string;
  portalUrl?: string;
}

export interface WebhookSimulationLog {
  id: string;
  timestamp: string;
  event: string;
  orderId: string;
  status: 'received' | 'forwarded_to_wc' | 'failed';
  details: string;
}

export interface DomainSearchResult {
  domain: string;
  available: boolean;
  price?: string;
  currency?: string;
  isPremium?: boolean;
}

export interface OnboardingSession {
  token: string;
  orderId: string;
  customerEmail: string;
  customerName: string;
  sku: string;
  seats: number;
  status: 'pending' | 'domain_configured' | 'provisioning' | 'completed' | 'failed';
  domain?: string;
  isNewDomain?: boolean;
  adminUsername?: string;
  adminPassword?: string;
  mapsApiKey?: string;
  googleCustomerId?: string;
  createdAt: string;
}

export interface ProvisioningStep {
  id: string;
  label: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  details?: string;
}
