<?php
/**
 * Plugin Name: GNB Mentor Bridge & Workspace Setup Button
 * Plugin URI: https://gnbmentor.com
 * Description: Styles and renders the Google Workspace Onboarding Portal button on WooCommerce Thank You page, linking orders seamlessly to portal.gnbmentor.com.
 * Version: 2.4.0
 * Author: GNB Mentor Team
 * Text Domain: gnbmentor-pay
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * 1. Inject Modern Button & Card Styles into the Thank You (Order Received) Page
 */
add_action('wp_head', 'gnbmentor_inject_thankyou_card_styles');

function gnbmentor_inject_thankyou_card_styles() {
    // Only inject on checkout order-received pages or order view
    if (function_exists('is_order_received_page') && is_order_received_page() || (isset($_GET['key']) && strpos($_SERVER['REQUEST_URI'] ?? '', 'order-received') !== false)) {
        ?>
        <style id="gnbmentor-workspace-thankyou-styles">
            /* ========================================================== */
            /* GNB MENTOR WORKSPACE SETUP CARD & BUTTON STYLES           */
            /* ========================================================== */
            .gnb-ws-setup-card,
            .gnbmentor-workspace-cta-card {
                margin: 32px 0 36px !important;
                padding: 32px 28px !important;
                background: linear-gradient(135deg, #090d16 0%, #151f32 100%) !important;
                border: 1px solid rgba(59, 130, 246, 0.4) !important;
                border-radius: 20px !important;
                box-shadow: 0 16px 40px -10px rgba(15, 23, 42, 0.5) !important;
                color: #ffffff !important;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
                text-align: left !important;
                display: block !important;
            }

            .gnb-ws-setup-header {
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                flex-wrap: wrap !important;
                gap: 16px !important;
                margin-bottom: 20px !important;
            }

            .gnb-ws-badge {
                display: flex !important;
                align-items: center !important;
                gap: 14px !important;
            }

            .gnb-ws-icon {
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                font-size: 26px !important;
                width: 52px !important;
                height: 52px !important;
                background: rgba(59, 130, 246, 0.15) !important;
                border: 1px solid rgba(59, 130, 246, 0.4) !important;
                border-radius: 14px !important;
            }

            .gnb-ws-kicker {
                display: block !important;
                font-size: 11px !important;
                font-weight: 700 !important;
                letter-spacing: 0.08em !important;
                text-transform: uppercase !important;
                color: #60a5fa !important;
                margin-bottom: 4px !important;
            }

            .gnb-ws-title {
                margin: 0 !important;
                font-size: 22px !important;
                font-weight: 800 !important;
                color: #ffffff !important;
                letter-spacing: -0.02em !important;
            }

            .gnb-ws-status-chip {
                display: inline-block !important;
                padding: 6px 14px !important;
                background: rgba(34, 197, 94, 0.15) !important;
                border: 1px solid rgba(34, 197, 94, 0.4) !important;
                border-radius: 20px !important;
                color: #4ade80 !important;
                font-size: 13px !important;
                font-weight: 700 !important;
            }

            .gnb-ws-intro {
                font-size: 15px !important;
                line-height: 1.6 !important;
                color: #94a3b8 !important;
                margin: 0 0 24px 0 !important;
            }

            .gnb-ws-intro strong {
                color: #f1f5f9 !important;
            }

            .gnb-ws-steps-grid {
                display: grid !important;
                grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)) !important;
                gap: 16px !important;
                margin-bottom: 28px !important;
            }

            .gnb-ws-step-item {
                display: flex !important;
                align-items: flex-start !important;
                gap: 12px !important;
                background: rgba(255, 255, 255, 0.04) !important;
                border: 1px solid rgba(255, 255, 255, 0.08) !important;
                border-radius: 14px !important;
                padding: 16px !important;
            }

            .gnb-step-num {
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                width: 28px !important;
                height: 28px !important;
                border-radius: 50% !important;
                background: #2563eb !important;
                color: #ffffff !important;
                font-weight: 800 !important;
                font-size: 13px !important;
                flex-shrink: 0 !important;
            }

            .gnb-step-info h4 {
                margin: 0 0 4px 0 !important;
                font-size: 14px !important;
                font-weight: 700 !important;
                color: #ffffff !important;
            }

            .gnb-step-info p {
                margin: 0 !important;
                font-size: 12px !important;
                line-height: 1.4 !important;
                color: #94a3b8 !important;
            }

            .gnb-ws-cta-box {
                display: flex !important;
                flex-wrap: wrap !important;
                align-items: center !important;
                gap: 14px !important;
                margin-bottom: 20px !important;
            }

            /* PRIMARY CTA BUTTON: LAUNCH SETUP PORTAL */
            .gnb-ws-btn-portal {
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                gap: 10px !important;
                padding: 16px 32px !important;
                background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%) !important;
                color: #ffffff !important;
                text-decoration: none !important;
                font-size: 16px !important;
                font-weight: 800 !important;
                border-radius: 14px !important;
                box-shadow: 0 8px 24px -4px rgba(37, 99, 235, 0.6) !important;
                transition: transform 0.15s ease, box-shadow 0.15s ease !important;
                cursor: pointer !important;
                text-align: center !important;
                border: none !important;
            }

            .gnb-ws-btn-portal:hover,
            .gnb-ws-btn-portal:focus {
                background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%) !important;
                transform: translateY(-2px) !important;
                box-shadow: 0 12px 28px -4px rgba(37, 99, 235, 0.7) !important;
                color: #ffffff !important;
                text-decoration: none !important;
            }

            /* SECONDARY BUTTON: WHATSAPP CONCIERGE */
            .gnb-ws-btn-wa {
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                gap: 8px !important;
                padding: 16px 24px !important;
                background: rgba(34, 197, 94, 0.15) !important;
                border: 1px solid rgba(34, 197, 94, 0.4) !important;
                color: #4ade80 !important;
                text-decoration: none !important;
                font-size: 14px !important;
                font-weight: 700 !important;
                border-radius: 14px !important;
                transition: transform 0.15s ease, background 0.15s ease !important;
            }

            .gnb-ws-btn-wa:hover,
            .gnb-ws-btn-wa:focus {
                background: rgba(34, 197, 94, 0.25) !important;
                transform: translateY(-2px) !important;
                color: #86efac !important;
                text-decoration: none !important;
            }

            .gnb-ws-guarantee {
                padding-top: 14px !important;
                border-top: 1px solid rgba(255, 255, 255, 0.08) !important;
                font-size: 12px !important;
                color: #64748b !important;
            }
        </style>
        <?php
    }
}

/**
 * 2. Render Onboarding Card Fallback if not already in template
 */
add_action('woocommerce_thankyou', 'gnbmentor_render_workspace_portal_button', 25, 1);
add_action('woocommerce_order_details_after_order_table', 'gnbmentor_render_workspace_portal_button', 25, 1);

function gnbmentor_render_workspace_portal_button($order_id) {
    static $rendered = false;
    if ($rendered) {
        return;
    }

    if (!$order_id && isset($_GET['order_id'])) {
        $order_id = absint($_GET['order_id']);
    }

    if (!$order_id) {
        return;
    }

    $order = function_exists('wc_get_order') ? wc_get_order($order_id) : null;
    $order_key      = $order ? $order->get_order_key() : (isset($_GET['key']) ? sanitize_text_field($_GET['key']) : '');
    $customer_email = $order ? $order->get_billing_email() : '';
    $customer_name  = $order ? trim($order->get_billing_first_name() . ' ' . $order->get_billing_last_name()) : '';

    $plan_name = '';
    if ($order && method_exists($order, 'get_items')) {
        $items = $order->get_items();
        foreach ($items as $item) {
            $plan_name = $item->get_name();
            break;
        }
    }

    $portal_query = array(
        'email'  => $customer_email,
        'order'  => $order_id,
        'status' => 'paid',
        'ref'    => 'woocommerce_thankyou',
    );
    if (!empty($plan_name)) {
        $portal_query['plan'] = $plan_name;
    }

    $portal_url = add_query_arg($portal_query, 'https://portal.gnbmentor.com/register');

    $rendered = true;
    ?>
    <script>
    // Ensure styles are attached and fallback card rendered only if missing
    document.addEventListener('DOMContentLoaded', function() {
        var existing = document.getElementById('gnbWsSetupCard');
        if (!existing) {
            var placeholder = document.getElementById('gnbMentorFallbackPortalCard');
            if (placeholder) {
                placeholder.style.display = 'block';
            }
        }
    });
    </script>

    <div id="gnbMentorFallbackPortalCard" class="gnb-ws-setup-card" style="display: none;">
        <div class="gnb-ws-setup-header">
            <div class="gnb-ws-badge">
                <span class="gnb-ws-icon">💼</span>
                <div>
                    <span class="gnb-ws-kicker">NEXT STEP: AUTOMATED ONBOARDING</span>
                    <h2 class="gnb-ws-title">Setup Your Google Workspace</h2>
                </div>
            </div>
            <span class="gnb-ws-status-chip">✓ Payment Verified</span>
        </div>
        <p class="gnb-ws-intro">
            Thank you for choosing GNB MENTOR! Your order (Order #<?php echo esc_html($order_id); ?>) is confirmed. Click the button below to complete setup in our Google Workspace portal:
        </p>
        <div class="gnb-ws-cta-box">
            <a href="<?php echo esc_url($portal_url); ?>" class="gnb-ws-btn-portal" target="_blank" rel="noopener">
                <span>🚀 Launch Setup Portal Now &rarr;</span>
            </a>
            <a href="https://wa.me/923023167793?text=Hi%20GNB%20MENTOR%20Team%2C%20I%20completed%20Google%20Workspace%20Order%20%23<?php echo esc_attr($order_id); ?>." class="gnb-ws-btn-wa" target="_blank" rel="noopener">
                <span>💬 WhatsApp Setup Concierge (+92-302-3167793)</span>
            </a>
        </div>
    </div>
    <?php
}

/**
 * 3. Safe WooCommerce Payment Gateway Registration
 */
add_action('plugins_loaded', 'gnbmentor_pay_bootstrap_plugin', 11);

function gnbmentor_pay_bootstrap_plugin() {
    if (!class_exists('WC_Payment_Gateway')) {
        return;
    }

    if (!class_exists('WC_Gateway_GNBMentor_Pay')) {
        class WC_Gateway_GNBMentor_Pay extends WC_Payment_Gateway {
            public function __construct() {
                $this->id                 = 'gnbmentor_pay';
                $this->icon               = 'https://pay.google.com/about/static/images/logos/google-pay-logo.svg';
                $this->has_fields         = false;
                $this->method_title       = __('Google Pay & Cards (pay.gnbmentor.com)', 'gnbmentor-pay');
                $this->method_description = __('Redirects customers to pay.gnbmentor.com for Google Pay and Stripe checkout.', 'gnbmentor-pay');

                $this->init_form_fields();
                $this->init_settings();

                $this->title       = $this->get_option('title', 'Google Pay & Card');
                $this->description = $this->get_option('description', 'Pay quickly and securely with Google Pay or your credit/debit card.');

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
                        'title'   => __('Title', 'gnbmentor-pay'),
                        'type'    => 'text',
                        'default' => 'Google Pay & Card',
                    ),
                );
            }

            public function process_payment($order_id) {
                $order = wc_get_order($order_id);
                return array(
                    'result'   => 'success',
                    'redirect' => $this->get_return_url($order),
                );
            }
        }
    }

    add_filter('woocommerce_payment_gateways', function ($gateways) {
        $gateways[] = 'WC_Gateway_GNBMentor_Pay';
        return $gateways;
    });
}
