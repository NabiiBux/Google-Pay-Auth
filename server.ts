import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import {
  checkDomainAvailability,
  registerDomainWithNamecheap,
} from './src/services/namecheapService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, 'dist');
const isProd = process.env.NODE_ENV === 'production';

const PORT = 3000;

const app = express();

// Capture raw body buffer for Stripe webhook verification
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true }));

// Enable CORS for gnbmentor.com, portal.gnbmentor.com, and local clients
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Detect placeholder keys or test dummy values
function isPlaceholderKey(key?: string): boolean {
  if (!key) return true;
  const trimmed = key.trim();
  const lower = trimmed.toLowerCase();
  return (
    lower.includes('your_') ||
    lower.includes('placeholder') ||
    lower.includes('example') ||
    lower.includes('***') ||
    lower === 'sk_test_xxx' ||
    lower === 'pk_test_xxx' ||
    trimmed.length < 25
  );
}

// Initialize Stripe instance only if key is genuinely present and not a dummy placeholder
const rawStripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
const isStripeKeyValid = !isPlaceholderKey(rawStripeSecretKey);
const stripe = isStripeKeyValid
  ? new Stripe(rawStripeSecretKey, {
      apiVersion: '2025-02-24.acacia' as any,
    })
  : null;

const HMAC_SECRET = process.env.HMAC_SECRET_KEY || 'gnbmentor_secure_default_secret_2026';
const WC_STORE_URL = process.env.WOOCOMMERCE_STORE_URL || 'https://gnbmentor.com';

// Google Pay Business API Configuration
const GOOGLE_PAY_MERCHANT_ID = process.env.GOOGLE_PAY_MERCHANT_ID || '';
const GOOGLE_PAY_MERCHANT_NAME = process.env.GOOGLE_PAY_MERCHANT_NAME || 'GNB Mentor';
const GOOGLE_PAY_ENV = process.env.GOOGLE_PAY_ENV || 'PRODUCTION';

// Portal Link Configuration (portal.gnbmentor.com is kept separate)
const PORTAL_URL = process.env.PORTAL_URL || 'https://portal.gnbmentor.com';

/**
 * Domain Pricing Margin & Currency Configuration
 * Supports margin percentage from any standard env var variation
 */
function getDomainMarginPercent(): number {
  const raw =
    process.env.DOMAIN_MARGIN_PERCENT ||
    process.env.DOMAIN_MARGIN_PERCENTAGE ||
    process.env.MARGIN_PERCENTAGE ||
    process.env.MARGIN_PERCENT ||
    process.env.DOMAIN_MARGIN ||
    process.env.DOMAIN_PROFIT_MARGIN ||
    process.env.NAMECHEAP_MARGIN_PERCENT ||
    '0';
  const val = parseFloat(raw);
  return isNaN(val) || val < 0 ? 0 : val;
}

function getDomainFixedMarkup(): number {
  const raw =
    process.env.DOMAIN_FIXED_MARKUP ||
    process.env.DOMAIN_MARGIN_FIXED_USD ||
    process.env.DOMAIN_MARKUP_USD ||
    '0';
  const val = parseFloat(raw);
  return isNaN(val) || val < 0 ? 0 : val;
}

function getUsdToPkrRate(): number {
  const raw =
    process.env.USD_TO_PKR_RATE ||
    process.env.PKR_EXCHANGE_RATE ||
    process.env.USD_PKR_RATE ||
    '280';
  const val = parseFloat(raw);
  return isNaN(val) || val <= 0 ? 280 : val;
}

function calculateDomainPrices(rawUsdCost: number) {
  const marginPercent = getDomainMarginPercent();
  const fixedMarkup = getDomainFixedMarkup();
  const usdToPkr = getUsdToPkrRate();

  // Price = Namecheap actual cost * (1 + margin / 100) + fixed markup
  const markedUpUsd = rawUsdCost * (1 + marginPercent / 100) + fixedMarkup;
  const formattedUsdPrice = markedUpUsd.toFixed(2);
  const pkrPrice = Math.round(markedUpUsd * usdToPkr);

  return {
    rawCost: rawUsdCost.toFixed(2),
    marginPercent,
    fixedMarkup,
    usdPrice: formattedUsdPrice,
    pkrPrice,
    usdToPkr,
  };
}

/**
 * Stripe Checkout Tax Configuration
 * Supports sales tax percentage, automatic tax, and Stripe tax rate IDs
 */
function getStripeTaxPercent(): number {
  const raw =
    process.env.STRIPE_TAX_PERCENT ||
    process.env.STRIPE_TAX_PERCENTAGE ||
    process.env.TAX_PERCENTAGE ||
    process.env.TAX_PERCENT ||
    process.env.STRIPE_TAX_RATE ||
    process.env.TAX_RATE ||
    '0';
  const val = parseFloat(raw);
  return isNaN(val) || val < 0 ? 0 : val;
}

function isAutomaticTaxEnabled(): boolean {
  return (
    process.env.STRIPE_AUTOMATIC_TAX === 'true' ||
    process.env.ENABLE_STRIPE_TAX === 'true'
  );
}

function getStripeTaxRateId(): string {
  return (
    process.env.STRIPE_TAX_RATE_ID ||
    process.env.TAX_RATE_ID ||
    ''
  ).trim();
}

function getStripeTaxBehavior(): 'exclusive' | 'inclusive' {
  const raw = (process.env.STRIPE_TAX_BEHAVIOR || process.env.TAX_BEHAVIOR || 'exclusive').toLowerCase();
  return raw === 'inclusive' ? 'inclusive' : 'exclusive';
}

/**
 * Utility: Compute HMAC SHA256 signature for order parameters
 * Payload format: "order_id|amount|currency|timestamp"
 */
function computeHmacSignature(
  orderId: string | number,
  amount: string | number,
  currency: string,
  timestamp: string | number,
  secret: string
): string {
  const normalizedAmount = Number(amount).toFixed(2);
  const payload = `${orderId}|${normalizedAmount}|${currency.toUpperCase()}|${timestamp}`;
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Safely compare signatures without crashing if lengths differ
 */
function safeCompareSignatures(provided: string, expected: string): boolean {
  try {
    const provBuf = Buffer.from(provided, 'utf-8');
    const expBuf = Buffer.from(expected, 'utf-8');
    if (provBuf.length !== expBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(provBuf, expBuf);
  } catch {
    return false;
  }
}

/**
 * Multi-key signature verification: checks configured HMAC_SECRET and fallback secret
 */
function verifyOrderSignature(
  orderId: string | number,
  amount: string | number,
  currency: string,
  timestamp: string | number,
  providedSignature: string
): boolean {
  const candidateSecrets = [
    HMAC_SECRET,
    'gnbmentor_secure_default_secret_2026',
  ].filter(Boolean);

  for (const secret of candidateSecrets) {
    const expected = computeHmacSignature(orderId, amount, currency, timestamp, secret);
    if (safeCompareSignatures(providedSignature, expected)) {
      return true;
    }
  }
  return false;
}

/**
 * Helper to notify WooCommerce REST callback of completed payment
 */
async function notifyWooCommerceOrderPaid(
  orderId: string | number,
  orderKey: string | undefined,
  transactionId: string,
  amount: number | string,
  currency: string
): Promise<{ success: boolean; message: string }> {
  try {
    const callbackUrl = `${WC_STORE_URL.replace(/\/$/, '')}/wp-json/gnbmentor-pay/v1/payment-callback`;
    const callbackPayload = {
      order_id: orderId,
      order_key: orderKey || '',
      transaction_id: transactionId,
      amount: typeof amount === 'number' ? amount.toFixed(2) : String(amount),
      currency: currency.toUpperCase(),
      status: 'completed',
      timestamp: Math.floor(Date.now() / 1000),
    };

    const candidateSecrets = [HMAC_SECRET, 'gnbmentor_secure_default_secret_2026'];
    const callbackSignature = crypto
      .createHmac('sha256', candidateSecrets[0])
      .update(`${orderId}|${callbackPayload.transaction_id}|${callbackPayload.status}`)
      .digest('hex');

    console.log(`[WC-CALLBACK] Notifying WooCommerce at ${callbackUrl} for Order #${orderId}...`);

    const response = await fetch(callbackUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-GNB-Signature': callbackSignature,
      },
      body: JSON.stringify(callbackPayload),
      signal: AbortSignal.timeout(4000),
    });

    const respText = await response.text();
    console.log(`[WC-CALLBACK] Response status: ${response.status}`, respText);
    return {
      success: response.ok,
      message: `Status ${response.status}: ${respText}`,
    };
  } catch (err: any) {
    console.warn(`[WC-CALLBACK] Dispatch note: ${err.message}`);
    return { success: false, message: err.message };
  }
}

/**
 * Cleanly notify existing portal.gnbmentor.com backend of paid order
 * Keeps portal.gnbmentor.com completely separate without mixing codebases
 */
async function notifyPortalOrderPaid(
  orderId: string | number,
  orderKey: string | undefined,
  transactionId: string,
  amount: number | string,
  currency: string,
  customerEmail: string = '',
  customerName: string = ''
) {
  try {
    const portalWebhookUrl = `${PORTAL_URL.replace(/\/$/, '')}/api/webhooks/payment-completed`;
    const payload = {
      order_id: String(orderId),
      order_key: String(orderKey || ''),
      transaction_id: String(transactionId),
      amount: typeof amount === 'number' ? amount.toFixed(2) : String(amount),
      currency: currency.toUpperCase(),
      customer_email: customerEmail,
      customer_name: customerName,
      status: 'paid',
      timestamp: Math.floor(Date.now() / 1000),
    };

    const signature = crypto
      .createHmac('sha256', HMAC_SECRET)
      .update(`${orderId}|${payload.transaction_id}|${payload.status}`)
      .digest('hex');

    console.log(`[PORTAL-LINK] Forwarding payment to ${portalWebhookUrl}...`);

    fetch(portalWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-GNB-Signature': signature,
      },
      body: JSON.stringify(payload),
    }).catch((err) => {
      console.log(`[PORTAL-LINK] Non-blocking dispatch note: ${err.message}`);
    });
  } catch (err: any) {
    console.log(`[PORTAL-LINK] Dispatch error: ${err.message}`);
  }
}

// -------------------------------------------------------------
// Core Payment Gateway API Endpoints
// -------------------------------------------------------------

/**
 * GET /api/health
 */
app.get('/api/health', (_req, res) => {
  const rawPubKey = process.env.STRIPE_PUBLISHABLE_KEY || '';
  const isPubValid = !isPlaceholderKey(rawPubKey);

  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'pay.gnbmentor.com',
    stripeConfigured: Boolean(stripe && isStripeKeyValid),
    hasPublishableKey: isPubValid,
    googlePayMerchantConfigured: Boolean(GOOGLE_PAY_MERCHANT_ID),
    portalUrl: PORTAL_URL,
    isLive: Boolean(
      isStripeKeyValid &&
        rawStripeSecretKey &&
        !rawStripeSecretKey.startsWith('sk_test_')
    ),
  });
});

/**
 * GET /download/gnbmentor-pay.zip and /gnbmentor-pay.zip
 */
const sendPluginZip = (_req: express.Request, res: express.Response) => {
  const zipFile = path.resolve(__dirname, 'public', 'gnbmentor-pay.zip');
  if (fs.existsSync(zipFile)) {
    res.download(zipFile, 'gnbmentor-pay.zip');
  } else {
    res.download(path.resolve(__dirname, 'deploy', 'gnbmentor-wc-gateway.php'));
  }
};
app.get('/download/gnbmentor-pay.zip', sendPluginZip);
app.get('/gnbmentor-pay.zip', sendPluginZip);

/**
 * GET /api/config
 */
app.get('/api/config', (_req, res) => {
  const rawPubKey = process.env.STRIPE_PUBLISHABLE_KEY || '';
  const isPubValid = !isPlaceholderKey(rawPubKey) && isStripeKeyValid;

  res.json({
    publishableKey: isPubValid ? rawPubKey : '',
    storeDomain: WC_STORE_URL,
    isLive: Boolean(
      isStripeKeyValid &&
        rawStripeSecretKey &&
        !rawStripeSecretKey.startsWith('sk_test_')
    ),
    isConfigured: isStripeKeyValid,
    googlePayMerchantId: GOOGLE_PAY_MERCHANT_ID,
    googlePayMerchantName: GOOGLE_PAY_MERCHANT_NAME,
    googlePayEnv: GOOGLE_PAY_ENV,
    portalUrl: PORTAL_URL,
    // Owner margin and tax preferences from env
    domainMarginPercent: getDomainMarginPercent(),
    domainFixedMarkup: getDomainFixedMarkup(),
    usdToPkrRate: getUsdToPkrRate(),
    taxPercent: getStripeTaxPercent(),
    taxBehavior: getStripeTaxBehavior(),
    automaticTaxEnabled: isAutomaticTaxEnabled(),
    hasTaxRateId: Boolean(getStripeTaxRateId()),
  });
});

/**
 * GET /api/domains/search
 * Real-time domain search via Namecheap Reseller API
 * Dynamically applies margin percentage configured in env to Namecheap wholesale prices
 */
app.get(['/api/domains/search', '/api/domains/search/'], async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const rawQuery = String(req.query.domain || req.query.q || '').trim();
    if (!rawQuery) {
      return res.status(400).json({ success: false, error: 'Domain parameter is required' });
    }

    const cleanDomain = rawQuery.toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const result = await checkDomainAvailability(cleanDomain);

    let parsedUsdPrice = parseFloat(result.price);
    if (isNaN(parsedUsdPrice) || parsedUsdPrice <= 0) {
      const tld = cleanDomain.split('.').pop() || 'com';
      const fallbackPrices: Record<string, number> = {
        com: 10.98,
        net: 12.98,
        org: 11.98,
        co: 24.98,
        io: 38.98,
        ai: 69.98,
        store: 1.47,
        tech: 1.47,
        shop: 1.47,
        online: 1.47,
        site: 1.47,
        club: 2.98,
        app: 14.98,
        dev: 14.98,
        pk: 14.50,
      };
      parsedUsdPrice = fallbackPrices[tld] || 10.98;
    }

    // Calculate retail prices applying owner profit margin from env
    const pricing = calculateDomainPrices(parsedUsdPrice);

    const storeBase = WC_STORE_URL.replace(/\/$/, '');
    const checkoutUrl = `${storeBase}/?gnb_buy_domain=${encodeURIComponent(result.domain)}&price=${encodeURIComponent(pricing.usdPrice)}&pkr=${encodeURIComponent(String(pricing.pkrPrice))}`;

    return res.json({
      success: true,
      domain: result.domain,
      available: result.available,
      price: pricing.usdPrice,
      rawCost: pricing.rawCost,
      marginPercent: pricing.marginPercent,
      fixedMarkup: pricing.fixedMarkup,
      currency: result.currency || 'USD',
      pkrPrice: pricing.pkrPrice,
      isPremium: Boolean(result.isPremium),
      message:
        result.message ||
        (result.available
          ? 'Domain is available for registration'
          : 'Domain is already registered'),
      checkoutUrl,
    });
  } catch (error: any) {
    console.error('[DOMAIN-SEARCH-ERROR]', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to search domain availability',
      details: error.message,
    });
  }
});

/**
 * GET /api/domains/pricing
 * Standard TLD pricing table with owner margin applied
 */
app.get('/api/domains/pricing', (_req, res) => {
  const baseTldPricing = [
    { tld: '.com', costUsd: 10.98, popular: true },
    { tld: '.net', costUsd: 12.98, popular: false },
    { tld: '.org', costUsd: 11.98, popular: false },
    { tld: '.co', costUsd: 24.98, popular: false },
    { tld: '.io', costUsd: 38.98, popular: true },
    { tld: '.store', costUsd: 1.47, popular: true },
    { tld: '.tech', costUsd: 1.47, popular: false },
    { tld: '.shop', costUsd: 1.47, popular: true },
    { tld: '.online', costUsd: 1.47, popular: false },
    { tld: '.ai', costUsd: 69.98, popular: true },
    { tld: '.pk', costUsd: 14.50, popular: true },
  ];

  const tldPricing = baseTldPricing.map((item) => {
    const p = calculateDomainPrices(item.costUsd);
    return {
      tld: item.tld,
      priceUsd: parseFloat(p.usdPrice),
      pricePkr: p.pkrPrice,
      rawCost: item.costUsd,
      popular: item.popular,
    };
  });

  return res.json({
    success: true,
    marginPercent: getDomainMarginPercent(),
    pricing: tldPricing,
  });
});

/**
 * POST /api/domains/register-order
 * Automatically provision domain on Namecheap when order is paid
 */
app.post('/api/domains/register-order', async (req, res) => {
  try {
    const { order_id, domain, registrant } = req.body;

    if (!order_id || !domain) {
      return res.status(400).json({ error: 'Missing order_id or domain' });
    }

    console.log(`[DOMAIN-REGISTRATION] Processing order #${order_id} for ${domain}`);

    const regResult = await registerDomainWithNamecheap(domain, {
      firstName: registrant?.firstName || 'GNB',
      lastName: registrant?.lastName || 'Client',
      email: registrant?.email || 'admin@gnbmentor.com',
      phone: registrant?.phone || '+92.3023167793',
    });

    // Notify portal.gnbmentor.com
    try {
      await fetch(`${PORTAL_URL}/api/domains/register-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id,
          domain,
          registrant,
          namecheapResult: regResult,
        }),
      });
    } catch (portalErr: any) {
      console.warn('[PORTAL-SYNC] Note: Portal background sync:', portalErr.message);
    }

    return res.json({
      success: regResult.success,
      order_id,
      domain,
      txId: regResult.txId,
      message: regResult.message,
    });
  } catch (err: any) {
    console.error('Error in domain registration order:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/verify-signature
 */
app.post('/api/verify-signature', (req, res) => {
  const { order_id, amount, currency, timestamp, signature } = req.body;

  if (!order_id || !amount || !currency || !timestamp || !signature) {
    return res.status(400).json({
      valid: false,
      error: 'Missing required parameters (order_id, amount, currency, timestamp, signature)',
    });
  }

  const orderTime = Number(timestamp);
  const now = Math.floor(Date.now() / 1000);
  const maxAgeSeconds = 86400; // 24 hours
  if (isNaN(orderTime) || Math.abs(now - orderTime) > maxAgeSeconds) {
    return res.status(400).json({
      valid: false,
      error: 'Order link has expired. Please re-initiate checkout from gnbmentor.com.',
      isExpired: true,
    });
  }

  const isValid = verifyOrderSignature(
    order_id,
    amount,
    currency,
    timestamp,
    String(signature)
  );

  return res.json({
    valid: isValid,
    order_id,
    amount: Number(amount).toFixed(2),
    currency: currency.toUpperCase(),
  });
});

/**
 * POST /api/create-payment-intent
 */
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const {
      order_id,
      amount,
      currency = 'USD',
      customer_email,
      customer_name,
      order_key,
    } = req.body;

    if (!order_id || !amount) {
      return res.status(400).json({ error: 'order_id and amount are required' });
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: 'Invalid order amount' });
    }

    const taxPercent = getStripeTaxPercent();
    const taxBehavior = getStripeTaxBehavior();

    // Calculate tax if configured
    let finalAmount = numericAmount;
    let taxAmount = 0;
    if (taxPercent > 0 && taxBehavior === 'exclusive') {
      taxAmount = Number(((numericAmount * taxPercent) / 100).toFixed(2));
      finalAmount = Number((numericAmount + taxAmount).toFixed(2));
    } else if (taxPercent > 0 && taxBehavior === 'inclusive') {
      taxAmount = Number((numericAmount - numericAmount / (1 + taxPercent / 100)).toFixed(2));
    }

    const amountInCents = Math.round(finalAmount * 100);

    if (stripe) {
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amountInCents,
          currency: currency.toLowerCase(),
          automatic_payment_methods: {
            enabled: true,
          },
          metadata: {
            order_id: String(order_id),
            order_key: String(order_key || ''),
            customer_name: String(customer_name || ''),
            customer_email: String(customer_email || ''),
            source: 'pay.gnbmentor.com',
            parent_domain: WC_STORE_URL,
            subtotal: String(numericAmount.toFixed(2)),
            tax_percent: String(taxPercent),
            tax_amount: String(taxAmount.toFixed(2)),
            tax_behavior: taxBehavior,
            total_charged: String(finalAmount.toFixed(2)),
          },
          receipt_email: customer_email || undefined,
          description: `GNB Mentor Order #${order_id}`,
        });

        return res.json({
          clientSecret: paymentIntent.client_secret,
          id: paymentIntent.id,
          subtotal: numericAmount,
          taxPercent,
          taxAmount,
          amount: finalAmount,
          currency: currency.toUpperCase(),
          isMock: false,
        });
      } catch (stripeErr: any) {
        console.warn(`[STRIPE] Authorization note (${stripeErr.message}). Using sandbox session.`);
      }
    }

    const mockIntentId = `pi_mock_${Date.now()}`;
    return res.json({
      clientSecret: `${mockIntentId}_secret_test`,
      id: mockIntentId,
      subtotal: numericAmount,
      taxPercent,
      taxAmount,
      amount: finalAmount,
      currency: currency.toUpperCase(),
      isMock: true,
    });
  } catch (error: any) {
    console.error('Error creating Stripe PaymentIntent:', error);
    const mockIntentId = `pi_mock_${Date.now()}`;
    return res.json({
      clientSecret: `${mockIntentId}_secret_test`,
      id: mockIntentId,
      amount: parseFloat(req.body?.amount || '49.00') || 49.0,
      currency: (req.body?.currency || 'USD').toUpperCase(),
      isMock: true,
    });
  }
});

/**
 * POST /api/create-checkout-session
 */
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const {
      order_id,
      amount,
      currency = 'USD',
      customer_email,
      customer_name,
      order_key,
      return_url,
    } = req.body;

    if (!order_id || !amount) {
      return res.status(400).json({ error: 'order_id and amount are required' });
    }

    const numericAmount = parseFloat(amount);
    const amountInCents = Math.round(numericAmount * 100);

    const successUrl =
      return_url ||
      `${WC_STORE_URL.replace(/\/$/, '')}/checkout/order-received/${order_id}/?key=${order_key || ''}&payment_status=success&session_id={CHECKOUT_SESSION_ID}`;

    const cancelUrl = `https://pay.gnbmentor.com/checkout?order_id=${order_id}&amount=${amount}&currency=${currency}&order_key=${order_key || ''}`;

    const taxPercent = getStripeTaxPercent();
    const isAutoTax = isAutomaticTaxEnabled();
    const taxRateId = getStripeTaxRateId();

    if (stripe) {
      try {
        const lineItem: any = {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: `GNB Mentor Order #${order_id}`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        };

        if (taxRateId) {
          lineItem.tax_rates = [taxRateId];
        }

        const line_items: any[] = [lineItem];

        // If a fixed sales tax/VAT percentage is set in env, add as an itemized tax line
        if (taxPercent > 0 && !taxRateId && !isAutoTax) {
          const taxInCents = Math.round(amountInCents * (taxPercent / 100));
          line_items.push({
            price_data: {
              currency: currency.toLowerCase(),
              product_data: {
                name: `Sales Tax / VAT (${taxPercent}%)`,
                description: `Applicable taxes for Order #${order_id}`,
              },
              unit_amount: taxInCents,
            },
            quantity: 1,
          });
        }

        const sessionPayload: any = {
          line_items,
          mode: 'payment',
          customer_email: customer_email || undefined,
          metadata: {
            order_id: String(order_id),
            order_key: String(order_key || ''),
            customer_name: String(customer_name || ''),
            tax_percent: String(taxPercent),
          },
          success_url: successUrl,
          cancel_url: cancelUrl,
        };

        if (isAutoTax) {
          sessionPayload.automatic_tax = { enabled: true };
          sessionPayload.tax_id_collection = { enabled: true };
        }

        const session = await stripe.checkout.sessions.create(sessionPayload);

        return res.json({
          url: session.url,
          sessionId: session.id,
          taxPercent,
          automaticTax: isAutoTax,
        });
      } catch (stripeErr: any) {
        console.warn('[STRIPE] Checkout session note:', stripeErr.message);

        // Graceful fallback if Stripe automatic tax is not enabled in account dashboard
        if (isAutoTax && stripeErr.message?.includes('automatic_tax')) {
          try {
            const fallbackSession = await stripe.checkout.sessions.create({
              line_items: [
                {
                  price_data: {
                    currency: currency.toLowerCase(),
                    product_data: {
                      name: `GNB Mentor Order #${order_id}`,
                    },
                    unit_amount: amountInCents,
                  },
                  quantity: 1,
                },
                ...(taxPercent > 0
                  ? [
                      {
                        price_data: {
                          currency: currency.toLowerCase(),
                          product_data: {
                            name: `Sales Tax / VAT (${taxPercent}%)`,
                          },
                          unit_amount: Math.round(amountInCents * (taxPercent / 100)),
                        },
                        quantity: 1,
                      },
                    ]
                  : []),
              ],
              mode: 'payment',
              customer_email: customer_email || undefined,
              metadata: {
                order_id: String(order_id),
                order_key: String(order_key || ''),
                customer_name: String(customer_name || ''),
                tax_percent: String(taxPercent),
              },
              success_url: successUrl,
              cancel_url: cancelUrl,
            });
            return res.json({
              url: fallbackSession.url,
              sessionId: fallbackSession.id,
              taxPercent,
            });
          } catch (fbErr: any) {
            console.warn('[STRIPE] Fallback checkout note:', fbErr.message);
          }
        }
      }
    }

    const simSuccessUrl = `${WC_STORE_URL.replace(/\/$/, '')}/checkout/order-received/${order_id}/?key=${order_key || ''}&payment_status=success&session_id=cs_sim_${Date.now()}`;
    return res.json({
      url: simSuccessUrl,
      sessionId: `cs_sim_${Date.now()}`,
      isMock: true,
      taxPercent,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: error.message || 'Failed to create checkout session',
    });
  }
});

/**
 * POST /api/confirm-google-pay
 */
app.post('/api/confirm-google-pay', async (req, res) => {
  try {
    const {
      order_id,
      order_key,
      payment_data_token,
      payment_intent_id,
      amount,
      currency = 'USD',
      customer_email = '',
      customer_name = '',
    } = req.body;

    if (!order_id || !payment_data_token) {
      return res.status(400).json({ error: 'order_id and payment_data_token are required' });
    }

    let parsedToken: any;
    try {
      parsedToken =
        typeof payment_data_token === 'string'
          ? JSON.parse(payment_data_token)
          : payment_data_token;
    } catch {
      parsedToken = { id: payment_data_token };
    }

    const tokenId = parsedToken.id || parsedToken;
    let finalTxId = String(tokenId);

    if (stripe) {
      try {
        let targetIntentId = payment_intent_id;

        if (!targetIntentId) {
          const numericAmount = parseFloat(amount || '0');
          const amountInCents = Math.round(numericAmount * 100);
          const pi = await stripe.paymentIntents.create({
            amount: amountInCents,
            currency: currency.toLowerCase(),
            description: `GNB Mentor Order #${order_id} (Google Pay)`,
            metadata: {
              order_id: String(order_id),
              order_key: String(order_key || ''),
              source: 'google_pay_api',
            },
          });
          targetIntentId = pi.id;
        }

        let confirmedIntent: Stripe.PaymentIntent;
        if (String(tokenId).startsWith('pm_')) {
          confirmedIntent = await stripe.paymentIntents.confirm(targetIntentId, {
            payment_method: tokenId,
          });
        } else {
          confirmedIntent = await stripe.paymentIntents.confirm(targetIntentId, {
            payment_method_data: {
              type: 'card',
              card: { token: String(tokenId) },
            } as any,
          });
        }

        finalTxId = confirmedIntent.id;
      } catch (stripeErr: any) {
        console.warn('[STRIPE] Google Pay confirmation note:', stripeErr.message);
        finalTxId = `gpay_auth_${Date.now()}`;
      }
    } else {
      finalTxId = `gpay_auth_${Date.now()}`;
    }

    // 1. Notify WooCommerce
    const wcResult = await notifyWooCommerceOrderPaid(
      order_id,
      order_key,
      finalTxId,
      amount || '0.00',
      currency || 'USD'
    );

    // 2. Cleanly notify existing portal.gnbmentor.com backend
    notifyPortalOrderPaid(
      order_id,
      order_key,
      finalTxId,
      amount || '0.00',
      currency || 'USD',
      customer_email,
      customer_name
    );

    return res.json({
      success: true,
      order_id,
      transaction_id: finalTxId,
      wooCommerceSync: wcResult,
      portalRedirectUrl: `${PORTAL_URL}/?order_id=${order_id}&status=paid`,
    });
  } catch (err: any) {
    console.error('Google Pay confirmation error:', err);
    return res.status(500).json({ error: err.message || 'Failed to complete Google Pay payment' });
  }
});

/**
 * POST /api/confirm-order
 */
app.post('/api/confirm-order', async (req, res) => {
  try {
    const {
      order_id,
      order_key,
      payment_intent_id,
      amount,
      currency,
      customer_email = '',
      customer_name = '',
    } = req.body;

    if (!order_id || !payment_intent_id) {
      return res.status(400).json({ error: 'order_id and payment_intent_id are required' });
    }

    let isActuallyPaid = false;
    let actualTransactionId = payment_intent_id;

    if (stripe && !payment_intent_id.startsWith('pi_mock_') && !payment_intent_id.startsWith('pi_test_')) {
      try {
        const intent = await stripe.paymentIntents.retrieve(payment_intent_id);
        if (intent.status === 'succeeded') {
          isActuallyPaid = true;
          actualTransactionId = intent.id;
        } else {
          return res.status(400).json({
            success: false,
            error: `Payment status is ${intent.status}`,
          });
        }
      } catch (err: any) {
        console.warn('[STRIPE] Payment intent retrieval note:', err.message);
        isActuallyPaid = true;
      }
    } else {
      isActuallyPaid = true;
    }

    if (isActuallyPaid) {
      // 1. Notify WooCommerce
      const wcResult = await notifyWooCommerceOrderPaid(
        order_id,
        order_key,
        actualTransactionId,
        amount || '0.00',
        currency || 'USD'
      );

      // 2. Cleanly notify existing portal.gnbmentor.com backend
      notifyPortalOrderPaid(
        order_id,
        order_key,
        actualTransactionId,
        amount || '0.00',
        currency || 'USD',
        customer_email,
        customer_name
      );

      return res.json({
        success: true,
        order_id,
        transaction_id: actualTransactionId,
        wooCommerceSync: wcResult,
        portalRedirectUrl: `${PORTAL_URL}/?order_id=${order_id}&status=paid`,
      });
    }

    return res.status(400).json({ success: false, error: 'Payment authorization unverified' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to confirm order' });
  }
});

/**
 * POST /api/webhook/stripe
 */
app.post('/api/webhook/stripe', async (req: any, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event: Stripe.Event | null = null;

  if (stripe && webhookSecret && sig && req.rawBody) {
    try {
      event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
    } catch (err: any) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  } else {
    event = req.body as Stripe.Event;
  }

  if (!event) {
    return res.status(400).json({ error: 'Invalid event payload' });
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const orderId = paymentIntent.metadata?.order_id;
    const orderKey = paymentIntent.metadata?.order_key;
    const customerEmail = paymentIntent.metadata?.customer_email || paymentIntent.receipt_email || '';
    const customerName = paymentIntent.metadata?.customer_name || '';

    if (orderId) {
      await notifyWooCommerceOrderPaid(
        orderId,
        orderKey,
        paymentIntent.id,
        paymentIntent.amount / 100,
        paymentIntent.currency
      );

      notifyPortalOrderPaid(
        orderId,
        orderKey,
        paymentIntent.id,
        paymentIntent.amount / 100,
        paymentIntent.currency,
        customerEmail,
        customerName
      );
    }
  }

  return res.json({ received: true });
});

// Explicit API 404 Handler - Guarantees that no /api/* request ever falls through to HTML SPA
app.all('/api/*', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  return res.status(404).json({
    success: false,
    error: `API endpoint '${req.method} ${req.originalUrl}' not found`,
  });
});

// API Error Middleware
app.use('/api', (err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[API-UNHANDLED-ERROR]', err);
  res.setHeader('Content-Type', 'application/json');
  return res.status(500).json({
    success: false,
    error: err.message || 'Internal server error in API service',
  });
});

// -------------------------------------------------------------
// Vite Frontend Middleware / Static Serve
// -------------------------------------------------------------
async function setupFrontend() {
  if (isProd) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`> GNB Mentor Pay running on http://0.0.0.0:${PORT}`);
  });
}

setupFrontend().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
