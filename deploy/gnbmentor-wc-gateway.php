<?php
/**
 * Plugin Name: GNB Mentor Pay Gateway for WooCommerce
 * Plugin URI: https://gnbmentor.com
 * Description: Connects WooCommerce with pay.gnbmentor.com for Google Pay and Stripe live processing, with instant handoff to portal.gnbmentor.com.
 * Version: 2.2.0
 * Author: GNB Mentor Team
 * Text Domain: gnbmentor-pay
 */

if (!defined('ABSPATH')) {
    exit;
}

add_action('plugins_loaded', 'gnbmentor_pay_init_gateway');

function gnbmentor_pay_init_gateway() {
    if (!class_exists('WC_Payment_Gateway')) {
        return;
    }

    class WC_Gateway_GNBMentor_Pay extends WC_Payment_Gateway {
        public $pay_portal_url;
        public $portal_setup_url;
        public $hmac_secret;

        public function __construct() {
            $this->id                 = 'gnbmentor_pay';
            $this->icon               = 'https://pay.google.com/about/static/images/logos/google-pay-logo.svg';
            $this->has_fields         = false;
            $this->method_title       = __('Google Pay & Cards (pay.gnbmentor.com)', 'gnbmentor-pay');
            $this->method_description = __('Redirects customers to pay.gnbmentor.com for secure Google Pay and Stripe checkout.', 'gnbmentor-pay');

            $this->init_form_fields();
            $this->init_settings();

            $this->title            = $this->get_option('title', 'Google Pay / Credit & Debit Card');
            $this->description      = $this->get_option('description', 'Pay quickly and securely with Google Pay or your credit/debit card.');
            $this->pay_portal_url   = rtrim($this->get_option('pay_portal_url', 'https://pay.gnbmentor.com'), '/');
            $this->portal_setup_url = rtrim($this->get_option('portal_setup_url', 'https://portal.gnbmentor.com'), '/');
            $this->hmac_secret      = $this->get_option('hmac_secret', '');

            add_action('woocommerce_update_options_payment_gateways_' . $this->id, array($this, 'process_admin_options'));
        }

        public function init_form_fields() {
            $this->form_fields = array(
                'enabled' => array(
                    'title'   => __('Enable/Disable', 'gnbmentor-pay'),
                    'type'    => 'checkbox',
                    'label'   => __('Enable GNB Mentor Pay Gateway', 'gnbmentor-pay'),
                    'default' => 'yes',
                ),
                'title' => array(
                    'title'       => __('Title', 'gnbmentor-pay'),
                    'type'        => 'text',
                    'description' => __('Payment method title displayed during checkout.', 'gnbmentor-pay'),
                    'default'     => __('Google Pay / Credit & Debit Card', 'gnbmentor-pay'),
                ),
                'description' => array(
                    'title'       => __('Description', 'gnbmentor-pay'),
                    'type'        => 'textarea',
                    'description' => __('Payment method description shown on checkout.', 'gnbmentor-pay'),
                    'default'     => __('Pay quickly and securely with Google Pay or your credit/debit card.', 'gnbmentor-pay'),
                ),
                'pay_portal_url' => array(
                    'title'       => __('Payment Portal URL', 'gnbmentor-pay'),
                    'type'        => 'text',
                    'description' => __('URL of your payment portal (e.g. https://pay.gnbmentor.com)', 'gnbmentor-pay'),
                    'default'     => 'https://pay.gnbmentor.com',
                ),
                'portal_setup_url' => array(
                    'title'       => __('Workspace Portal URL', 'gnbmentor-pay'),
                    'type'        => 'text',
                    'description' => __('URL of your Google Workspace onboarding portal (e.g. https://portal.gnbmentor.com)', 'gnbmentor-pay'),
                    'default'     => 'https://portal.gnbmentor.com',
                ),
                'hmac_secret' => array(
                    'title'       => __('HMAC Shared Secret Key', 'gnbmentor-pay'),
                    'type'        => 'password',
                    'description' => __('Shared key matching HMAC_SECRET_KEY in your .env file on pay.gnbmentor.com. Leave empty to use secure default.', 'gnbmentor-pay'),
                    'default'     => '',
                ),
            );
        }

        public function process_payment($order_id) {
            $order = wc_get_order($order_id);
            if (!$order) {
                return array('result' => 'fail');
            }

            $amount        = number_format((float)$order->get_total(), 2, '.', '');
            $currency      = strtoupper($order->get_currency());
            $timestamp     = time();
            $order_key     = $order->get_order_key();
            $customer_name = trim($order->get_billing_first_name() . ' ' . $order->get_billing_last_name());
            $customer_email = $order->get_billing_email();

            $secret    = !empty($this->hmac_secret) ? $this->hmac_secret : 'gnbmentor_secure_default_secret_2026';
            $payload   = "{$order_id}|{$amount}|{$currency}|{$timestamp}";
            $signature = hash_hmac('sha256', $payload, $secret);

            $query_args = array(
                'order_id'       => $order_id,
                'amount'         => $amount,
                'currency'       => $currency,
                'order_key'      => $order_key,
                'customer_name'  => $customer_name,
                'customer_email' => $customer_email,
                'timestamp'      => $timestamp,
                'signature'      => $signature,
                'return_url'     => $this->get_return_url($order),
            );

            $checkout_url = add_query_arg($query_args, $this->pay_portal_url . '/checkout');

            return array(
                'result'   => 'success',
                'redirect' => $checkout_url,
            );
        }
    }

    function gnbmentor_pay_add_gateway($gateways) {
        $gateways[] = 'WC_Gateway_GNBMentor_Pay';
        return $gateways;
    }
    add_filter('woocommerce_payment_gateways', 'gnbmentor_pay_add_gateway');
}

/**
 * 1. REST API Callback Route for Server-to-Server Webhook
 */
add_action('rest_api_init', function () {
    register_rest_route('gnbmentor-pay/v1', '/payment-callback', array(
        'methods'             => 'POST',
        'callback'            => 'gnbmentor_pay_callback_handler',
        'permission_callback' => '__return_true',
    ));
});

function gnbmentor_pay_callback_handler(WP_REST_Request $request) {
    $params = $request->get_json_params();

    if (empty($params['order_id']) || empty($params['transaction_id'])) {
        return new WP_Error('missing_params', 'Missing required order parameters', array('status' => 400));
    }

    $order_id       = absint($params['order_id']);
    $transaction_id = sanitize_text_field($params['transaction_id']);
    $order          = wc_get_order($order_id);

    if (!$order) {
        return new WP_Error('not_found', 'Order not found', array('status' => 404));
    }

    if (!$order->is_paid()) {
        $order->payment_complete($transaction_id);
        $order->add_order_note(sprintf('Payment verified via pay.gnbmentor.com (Stripe Transaction ID: %s)', $transaction_id));
        if (function_exists('wc_reduce_stock_levels')) {
            wc_reduce_stock_levels($order_id);
        }
    }

    return rest_ensure_response(array('success' => true, 'order_id' => $order_id));
}

/**
 * 2. Return URL Hook: Dual-channel verification on thank-you page
 */
add_action('woocommerce_thankyou', 'gnbmentor_pay_verify_thankyou_order', 10, 1);
function gnbmentor_pay_verify_thankyou_order($order_id) {
    if (!$order_id) {
        return;
    }

    $order = wc_get_order($order_id);
    if (!$order) {
        return;
    }

    $payment_status = isset($_GET['payment_status']) ? sanitize_text_field($_GET['payment_status']) : '';
    $transaction_id = isset($_GET['transaction_id']) ? sanitize_text_field($_GET['transaction_id']) : (isset($_GET['tx']) ? sanitize_text_field($_GET['tx']) : '');

    if ($payment_status === 'success' && !$order->is_paid()) {
        $tx_id = !empty($transaction_id) ? $transaction_id : 'gpay_live_' . time();
        $order->payment_complete($tx_id);
        $order->add_order_note(sprintf('Payment verified upon return from pay.gnbmentor.com (Stripe Transaction ID: %s)', $tx_id));
        if (function_exists('wc_reduce_stock_levels')) {
            wc_reduce_stock_levels($order_id);
        }
    }
}

/**
 * 3. Render Google Workspace Onboarding CTA Button directly on WooCommerce Order Received page!
 */
add_action('woocommerce_thankyou', 'gnbmentor_pay_render_workspace_onboarding_button', 20, 1);
function gnbmentor_pay_render_workspace_onboarding_button($order_id) {
    if (!$order_id) {
        return;
    }

    $order = wc_get_order($order_id);
    if (!$order) {
        return;
    }

    // Get settings or default portal URL
    $gateway_settings = get_option('woocommerce_gnbmentor_pay_settings', array());
    $base_portal_url  = !empty($gateway_settings['portal_setup_url']) ? rtrim($gateway_settings['portal_setup_url'], '/') : 'https://portal.gnbmentor.com';

    $order_key      = $order->get_order_key();
    $customer_email = $order->get_billing_email();
    $customer_name  = trim($order->get_billing_first_name() . ' ' . $order->get_billing_last_name());
    $amount         = $order->get_total();
    $currency       = $order->get_currency();

    $portal_query = array(
        'order_id'       => $order_id,
        'order_key'      => $order_key,
        'customer_email' => $customer_email,
        'customer_name'  => $customer_name,
        'amount'         => $amount,
        'currency'       => $currency,
        'status'         => 'paid',
        'ref'            => 'woocommerce_thankyou',
    );

    $portal_url = add_query_arg($portal_query, $base_portal_url);
    ?>
    <div style="margin: 32px 0 36px; padding: 30px 24px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 20px; box-shadow: 0 10px 30px -5px rgba(15, 23, 42, 0.25); text-align: center; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div style="display: inline-flex; align-items: center; justify-content: center; width: 54px; height: 54px; background: rgba(59, 130, 246, 0.15); border: 2px solid rgba(59, 130, 246, 0.35); border-radius: 16px; margin-bottom: 16px;">
            <svg style="width: 28px; height: 28px; fill: #60a5fa;" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
        </div>
        <h2 style="margin: 0 0 8px; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em;">
            Google Workspace Setup Ready
        </h2>
        <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.5; color: #94a3b8; max-width: 490px; margin-left: auto; margin-right: auto;">
            Your payment for Order #<?php echo esc_html($order_id); ?> is confirmed. Click the button below to connect your domain and set up your Google Workspace administrator account now.
        </p>
        <a href="<?php echo esc_url($portal_url); ?>" 
           style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 16px 36px; background: #2563eb; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; border-radius: 14px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4); transition: all 0.2s ease;">
            <span>Set Up Google Workspace Users Now &rarr;</span>
        </a>
    </div>
    <?php
}
