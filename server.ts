import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import dotenv from 'dotenv';
import Stripe from 'stripe';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, 'dist');
const hasDist = fs.existsSync(distPath);
const isProd = process.env.NODE_ENV === 'production' || hasDist;
const PORT = Number(process.env.PORT) || 3000;

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

// Initialize Stripe instance if secret key is present
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
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
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'pay.gnbmentor.com',
    stripeConfigured: Boolean(stripe),
    hasPublishableKey: Boolean(process.env.STRIPE_PUBLISHABLE_KEY),
    googlePayMerchantConfigured: Boolean(GOOGLE_PAY_MERCHANT_ID),
    portalUrl: PORTAL_URL,
    isLive: Boolean(
      process.env.STRIPE_SECRET_KEY &&
        !process.env.STRIPE_SECRET_KEY.startsWith('sk_test_')
    ),
  });
});

/**
 * GET /download/gnbmentor-pay.zip
 */
app.get('/download/gnbmentor-pay.zip', (_req, res) => {
  const zipFile = path.resolve(__dirname, 'public', 'gnbmentor-pay.zip');
  if (fs.existsSync(zipFile)) {
    res.download(zipFile, 'gnbmentor-pay.zip');
  } else {
    res.download(path.resolve(__dirname, 'deploy', 'gnbmentor-wc-gateway.php'));
  }
});

/**
 * GET /api/config
 */
app.get('/api/config', (_req, res) => {
  res.json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    storeDomain: WC_STORE_URL,
    isLive: Boolean(
      process.env.STRIPE_SECRET_KEY &&
        !process.env.STRIPE_SECRET_KEY.startsWith('sk_test_')
    ),
    isConfigured: Boolean(stripe),
    googlePayMerchantId: GOOGLE_PAY_MERCHANT_ID,
    googlePayMerchantName: GOOGLE_PAY_MERCHANT_NAME,
    googlePayEnv: GOOGLE_PAY_ENV,
    portalUrl: PORTAL_URL,
  });
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

    const amountInCents = Math.round(numericAmount * 100);

    if (stripe) {
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
        },
        receipt_email: customer_email || undefined,
        description: `GNB Mentor Order #${order_id}`,
      });

      return res.json({
        clientSecret: paymentIntent.client_secret,
        id: paymentIntent.id,
        amount: numericAmount,
        currency: currency.toUpperCase(),
        isMock: false,
      });
    }

    const mockIntentId = `pi_mock_${Date.now()}`;
    return res.json({
      clientSecret: `${mockIntentId}_secret_test`,
      id: mockIntentId,
      amount: numericAmount,
      currency: currency.toUpperCase(),
      isMock: true,
    });
  } catch (error: any) {
    console.error('Error creating Stripe PaymentIntent:', error);
    return res.status(500).json({
      error: error.message || 'Failed to initialize payment',
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

    if (stripe) {
      const successUrl =
        return_url ||
        `${WC_STORE_URL.replace(/\/$/, '')}/checkout/order-received/${order_id}/?key=${order_key || ''}&payment_status=success&session_id={CHECKOUT_SESSION_ID}`;

      const cancelUrl = `https://pay.gnbmentor.com/checkout?order_id=${order_id}&amount=${amount}&currency=${currency}&order_key=${order_key || ''}`;

      const session = await stripe.checkout.sessions.create({
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
        ],
        mode: 'payment',
        customer_email: customer_email || undefined,
        metadata: {
          order_id: String(order_id),
          order_key: String(order_key || ''),
          customer_name: String(customer_name || ''),
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
      });

      return res.json({
        url: session.url,
        sessionId: session.id,
      });
    }

    return res.status(400).json({
      error: 'Stripe is not configured with secret key yet.',
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

    if (stripe && !payment_intent_id.startsWith('pi_mock_')) {
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
