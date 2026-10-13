import React, { useState } from 'react';
import {
  Code,
  Copy,
  Check,
  Server,
  CreditCard,
  Layers,
  Terminal,
  ExternalLink,
  ShieldCheck,
  Play,
  FileText,
} from 'lucide-react';

interface IntegrationHubProps {
  initialTab?: 'woocommerce' | 'stripe' | 'vps' | 'simulator';
  onNavigateToCheckoutWithUrl?: (url: string) => void;
}

export const IntegrationHub: React.FC<IntegrationHubProps> = ({
  initialTab = 'woocommerce',
  onNavigateToCheckoutWithUrl,
}) => {
  const [activeTab, setActiveTab] = useState<'woocommerce' | 'stripe' | 'vps' | 'simulator'>(
    initialTab
  );
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Simulator Form State
  const [simOrderId, setSimOrderId] = useState('2048');
  const [simAmount, setSimAmount] = useState('75.00');
  const [simCurrency, setSimCurrency] = useState('USD');
  const [simCustomerName, setSimCustomerName] = useState('Zayd Khan');
  const [simCustomerEmail, setSimCustomerEmail] = useState('zayd@example.com');
  const [generatedUrl, setGeneratedUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [simWebhookStatus, setSimWebhookStatus] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleGenerateSignedUrl = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/simulate-woocommerce-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: simOrderId,
          amount: simAmount,
          currency: simCurrency,
          customer_name: simCustomerName,
          customer_email: simCustomerEmail,
        }),
      });
      const data = await res.json();
      setGeneratedUrl(data.redirectUrl);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTriggerTestWebhook = async () => {
    setSimWebhookStatus('Dispatching test webhook event...');
    try {
      const res = await fetch('/api/webhook/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'payment_intent.succeeded',
          data: {
            object: {
              id: `pi_test_${Date.now()}`,
              amount: Math.round(parseFloat(simAmount) * 100),
              currency: simCurrency.toLowerCase(),
              metadata: {
                order_id: simOrderId,
                customer_name: simCustomerName,
                source: 'simulation_tester',
              },
            },
          },
        }),
      });
      const data = await res.json();
      setSimWebhookStatus(`Success! Webhook received (Event: ${data.eventType || 'succeeded'})`);
    } catch (err: any) {
      setSimWebhookStatus(`Error dispatching webhook: ${err.message}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Integration & Deployment Hub
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Everything required to connect <strong className="text-slate-800">gnbmentor.com</strong> with{' '}
          <strong className="text-slate-800">pay.gnbmentor.com</strong>, configure Stripe webhooks, and deploy on your AlmaLinux VPS.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-8 overflow-x-auto space-x-8">
        <button
          onClick={() => setActiveTab('woocommerce')}
          className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'woocommerce'
              ? 'border-indigo-600 text-indigo-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>WooCommerce Gateway Plugin</span>
        </button>
        <button
          onClick={() => setActiveTab('stripe')}
          className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'stripe'
              ? 'border-indigo-600 text-indigo-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Stripe & Google Pay Setup</span>
        </button>
        <button
          onClick={() => setActiveTab('vps')}
          className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'vps'
              ? 'border-indigo-600 text-indigo-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>AlmaLinux VPS & PM2 Guide</span>
        </button>
        <button
          onClick={() => setActiveTab('simulator')}
          className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'simulator'
              ? 'border-indigo-600 text-indigo-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>URL & Webhook Tester</span>
        </button>
      </div>

      {/* TAB 1: WooCommerce Plugin */}
      {activeTab === 'woocommerce' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8">
            <h2 className="text-lg font-bold text-slate-900">
              1. Drop-in WordPress / WooCommerce Plugin
            </h2>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              We have generated a standalone WooCommerce payment gateway plugin located at{' '}
              <code className="text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-mono">
                deploy/gnbmentor-wc-gateway.php
              </code>
              . It creates a seamless checkout option on <strong>gnbmentor.com</strong> that securely signs order
              details and redirects the student to <strong>pay.gnbmentor.com</strong>.
            </p>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Step 1: Upload
                </span>
                <p className="text-xs text-slate-700 mt-1">
                  Upload file to{' '}
                  <code className="font-mono text-slate-900 bg-white px-1 py-0.5 rounded border border-slate-200">
                    wp-content/plugins/gnbmentor-pay/
                  </code>
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Step 2: Activate
                </span>
                <p className="text-xs text-slate-700 mt-1">
                  Go to <strong>WP Admin &gt; Plugins</strong> and activate &quot;GNB Mentor Pay Gateway for
                  WooCommerce&quot;.
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Step 3: Secret Key
                </span>
                <p className="text-xs text-slate-700 mt-1">
                  In <strong>WooCommerce &gt; Settings &gt; Payments</strong>, paste your shared HMAC Secret Key.
                </p>
              </div>
            </div>

            {/* Code Snippet Box */}
            <div className="mt-6">
              <div className="flex items-center justify-between bg-slate-900 text-slate-300 px-4 py-2.5 rounded-t-xl text-xs font-mono">
                <span>deploy/gnbmentor-wc-gateway.php</span>
                <button
                  onClick={() =>
                    copyToClipboard(
                      `<?php\n// Complete plugin located in deploy/gnbmentor-wc-gateway.php in project repository\n// Upload to wp-content/plugins/gnbmentor-pay/gnbmentor-wc-gateway.php`,
                      'wc-plugin-path'
                    )
                  }
                  className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
                >
                  {copiedKey === 'wc-plugin-path' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy Path</span>
                </button>
              </div>
              <pre className="bg-slate-950 text-slate-200 p-4 rounded-b-xl text-xs font-mono overflow-x-auto max-h-72 leading-relaxed">
{`// Excerpt of HMAC Redirect Mechanism from deploy/gnbmentor-wc-gateway.php:

$amount       = number_format((float)$order->get_total(), 2, '.', '');
$currency     = strtoupper($order->get_currency());
$timestamp    = time();

// Compute SHA256 HMAC Signature
$payload   = "{$order_id}|{$amount}|{$currency}|{$timestamp}";
$signature = hash_hmac('sha256', $payload, $this->hmac_secret);

// Redirect student to verified Google Pay portal
$redirect_url = add_query_arg(array(
    'order_id'       => $order_id,
    'amount'         => $amount,
    'currency'       => $currency,
    'order_key'      => $order->get_order_key(),
    'customer_name'  => $order->get_billing_first_name() . ' ' . $order->get_billing_last_name(),
    'customer_email' => $order->get_billing_email(),
    'timestamp'      => $timestamp,
    'signature'      => $signature,
), 'https://pay.gnbmentor.com/checkout');

return array(
    'result'   => 'success',
    'redirect' => $redirect_url,
);`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Stripe & Google Pay */}
      {activeTab === 'stripe' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8">
            <h2 className="text-lg font-bold text-slate-900">
              2. Stripe & Google Pay Domain Verification
            </h2>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              Because <strong>pay.gnbmentor.com</strong> is already verified with Google to receive Google Pay payments,
              your Stripe integration is set to utilize direct Google Pay tokenization.
            </p>

            <div className="mt-6 space-y-4">
              <div className="border border-slate-200 rounded-xl p-5 bg-slate-50">
                <h3 className="text-sm font-semibold text-slate-900">
                  A. Stripe Webhook Endpoint Setup
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  In your <a href="https://dashboard.stripe.com/webhooks" target="_blank" rel="noreferrer" className="text-indigo-600 underline">Stripe Dashboard &gt; Developers &gt; Webhooks</a>, add your new endpoint:
                </p>
                <div className="mt-3 flex items-center justify-between bg-white border border-slate-200 px-3.5 py-2.5 rounded-lg text-xs font-mono">
                  <span className="text-slate-800">https://pay.gnbmentor.com/api/webhook/stripe</span>
                  <button
                    onClick={() =>
                      copyToClipboard('https://pay.gnbmentor.com/api/webhook/stripe', 'webhook-url')
                    }
                    className="hover:text-indigo-600"
                  >
                    {copiedKey === 'webhook-url' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-400" />}
                  </button>
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  Select events to listen for: <code className="font-mono text-slate-700 bg-slate-200/60 px-1 py-0.5 rounded">payment_intent.succeeded</code>, <code className="font-mono text-slate-700 bg-slate-200/60 px-1 py-0.5 rounded">payment_intent.payment_failed</code>.
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-5 bg-slate-50">
                <h3 className="text-sm font-semibold text-slate-900">
                  B. Server Environment Variables (.env)
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  On your AlmaLinux server, set these keys in <code className="font-mono text-xs">/var/www/pay.gnbmentor.com/.env</code>:
                </p>
                <pre className="mt-3 bg-slate-950 text-slate-200 p-4 rounded-xl text-xs font-mono overflow-x-auto">
{`PORT=3000
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
HMAC_SECRET_KEY="your_secure_shared_secret"
WOOCOMMERCE_STORE_URL="https://gnbmentor.com"`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AlmaLinux VPS & PM2 */}
      {activeTab === 'vps' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8">
            <h2 className="text-lg font-bold text-slate-900">
              3. AlmaLinux VPS Hosting & PM2 Setup
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Your server will host this Node.js repository on port 3000, managed 24/7 by PM2, with Nginx serving as the reverse proxy and handling SSL for <strong>pay.gnbmentor.com</strong>.
            </p>

            <div className="mt-6 space-y-4">
              <div className="p-4 bg-slate-900 text-slate-200 rounded-xl text-xs font-mono">
                <div className="flex justify-between items-center pb-2 mb-2 border-b border-slate-800 text-slate-400">
                  <span>AlmaLinux 8 / 9 Quick Install Commands</span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `# 1. Update and install Node 20 & Nginx\ndnf update -y\ndnf module enable nodejs:20 -y\ndnf install -y nodejs nginx git\n\n# 2. Install PM2\nnpm install -g pm2\n\n# 3. Firewalld & SELinux\nfirewall-cmd --permanent --add-service=http --add-service=https\nfirewall-cmd --reload\nsetsebool -P httpd_can_network_connect 1`,
                        'almalinux-cmds'
                      )
                    }
                    className="hover:text-white flex items-center gap-1"
                  >
                    {copiedKey === 'almalinux-cmds' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy Commands</span>
                  </button>
                </div>
                <code>
                  # 1. Install Node.js 20 & Nginx<br />
                  dnf module enable nodejs:20 -y<br />
                  dnf install -y nodejs nginx git<br />
                  npm install -g pm2<br /><br />
                  # 2. Allow Firewall & Enable SELinux Reverse Proxying<br />
                  firewall-cmd --permanent --add-service=http --add-service=https<br />
                  firewall-cmd --reload<br />
                  setsebool -P httpd_can_network_connect 1<br /><br />
                  # 3. Clone Repository & Build
                  git clone https://github.com/NabiiBux/Google-Pay-Auth.git /var/www/pay.gnbmentor.com
                  cd /var/www/pay.gnbmentor.com
                  npm install && npm run build

                  # 4. Start via PM2
                  pm2 start deploy/ecosystem.config.cjs --env production
                  pm2 save
                  pm2 startup
                </code>
              </div>

              {/* GitHub Repository Push Guide */}
              <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-indigo-600" />
                    <span>How to push this code to your GitHub Repository</span>
                  </h4>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `# Run inside your project directory:\ngit init\ngit remote add origin https://github.com/NabiiBux/Google-Pay-Auth.git\ngit branch -M main\ngit add .\ngit commit -m "feat: luxury pay.gnbmentor.com checkout portal with Google Pay & Stripe"\ngit push -u origin main`,
                        'git-cmds'
                      )
                    }
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                  >
                    {copiedKey === 'git-cmds' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>Copy Git Commands</span>
                  </button>
                </div>
                <p className="text-xs text-slate-600">
                  If you saw <em>&quot;fatal: not a git repository&quot;</em>, initialize git first in the folder before pushing:
                </p>
                <div className="p-3 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono">
                  <code>
                    git init<br />
                    git remote add origin https://github.com/NabiiBux/Google-Pay-Auth.git<br />
                    git branch -M main<br />
                    git add .<br />
                    git commit -m &quot;feat: luxury pay.gnbmentor.com checkout portal with Google Pay &amp; Stripe&quot;<br />
                    git push -u origin main
                  </code>
                </div>
              </div>

              <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800">
                    Nginx Virtual Host Configuration
                  </h4>
                  <span className="text-xs text-slate-500 font-mono">deploy/nginx.conf</span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Copy <code className="font-mono text-slate-800">deploy/nginx.conf</code> to{' '}
                  <code className="font-mono text-slate-800">/etc/nginx/conf.d/pay.gnbmentor.com.conf</code> and run{' '}
                  <code className="font-mono text-slate-800">certbot --nginx -d pay.gnbmentor.com</code>.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: URL & Webhook Simulator */}
      {activeTab === 'simulator' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8">
            <h2 className="text-lg font-bold text-slate-900">
              4. Interactive URL Generator & Webhook Tester
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Test how WooCommerce generates HMAC signed URLs and simulate live Stripe webhook notifications back to <strong>gnbmentor.com</strong>.
            </p>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Generator Form */}
              <div className="space-y-3 bg-slate-50 p-5 rounded-xl border border-slate-200">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Simulate WooCommerce Order Payload
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Order ID
                    </label>
                    <input
                      type="text"
                      value={simOrderId}
                      onChange={(e) => setSimOrderId(e.target.value)}
                      className="w-full h-9 px-3 text-xs rounded border border-slate-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Amount ({simCurrency})
                    </label>
                    <input
                      type="text"
                      value={simAmount}
                      onChange={(e) => setSimAmount(e.target.value)}
                      className="w-full h-9 px-3 text-xs rounded border border-slate-300 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Student Name
                  </label>
                  <input
                    type="text"
                    value={simCustomerName}
                    onChange={(e) => setSimCustomerName(e.target.value)}
                    className="w-full h-9 px-3 text-xs rounded border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Customer Email
                  </label>
                  <input
                    type="email"
                    value={simCustomerEmail}
                    onChange={(e) => setSimCustomerEmail(e.target.value)}
                    className="w-full h-9 px-3 text-xs rounded border border-slate-300 font-mono"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleGenerateSignedUrl}
                  disabled={isGenerating}
                  className="w-full mt-2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{isGenerating ? 'Calculating HMAC...' : 'Generate Signed URL'}</span>
                </button>
              </div>

              {/* Output Result */}
              <div className="space-y-4">
                <div className="bg-slate-900 text-slate-100 p-5 rounded-xl border border-slate-800 text-xs font-mono space-y-3">
                  <div className="flex justify-between items-center text-slate-400 border-b border-slate-800 pb-2">
                    <span>Generated Signed Checkout URL</span>
                    {generatedUrl && (
                      <button
                        onClick={() => copyToClipboard(generatedUrl, 'sim-url')}
                        className="hover:text-white"
                      >
                        {copiedKey === 'sim-url' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                  <div className="break-all text-slate-300 min-h-[60px]">
                    {generatedUrl ? (
                      generatedUrl
                    ) : (
                      <span className="text-slate-500">
                        Click &quot;Generate Signed URL&quot; on the left to compute HMAC signature.
                      </span>
                    )}
                  </div>
                  {generatedUrl && (
                    <a
                      href={generatedUrl}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white font-sans font-medium text-xs rounded hover:bg-indigo-700 transition-colors"
                    >
                      <span>Load This Order in Checkout</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {/* Webhook Test Action */}
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        Stripe Webhook Dispatcher
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Emulate Stripe firing <code className="font-mono">payment_intent.succeeded</code> to /api/webhook/stripe
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleTriggerTestWebhook}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      Fire Webhook
                    </button>
                  </div>
                  {simWebhookStatus && (
                    <div className="mt-2 text-xs font-mono text-slate-700 bg-white p-2 rounded border border-slate-200">
                      {simWebhookStatus}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
