<?php
/**
 * Plugin Name: GNB Mentor Pay & Domain Gateway
 * Plugin URI: https://gnbmentor.com
 * Description: Integrates Google Pay, Stripe, real-time Namecheap domain search with 1-click checkout, and Google Workspace onboarding.
 * Version: 2.5.0
 * Author: GNB Mentor Team
 * Text Domain: gnbmentor-pay
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * 1. Inject Modern Button & Card Styles into the Thank You (Order Received) Page
 */
if (!function_exists('gnbmentor_inject_thankyou_card_styles')) {
    add_action('wp_head', 'gnbmentor_inject_thankyou_card_styles');

    function gnbmentor_inject_thankyou_card_styles() {
        if ((function_exists('is_order_received_page') && is_order_received_page()) || (isset($_GET['key']) && strpos($_SERVER['REQUEST_URI'] ?? '', 'order-received') !== false)) {
            ?>
            <style id="gnbmentor-workspace-thankyou-styles">
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
                .gnb-ws-btn-portal:hover {
                    background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%) !important;
                    transform: translateY(-2px) !important;
                    box-shadow: 0 12px 28px -4px rgba(37, 99, 235, 0.7) !important;
                    color: #ffffff !important;
                }
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
                }
            </style>
            <?php
        }
    }
}

/**
 * 2. Render Google Workspace Onboarding Card on WooCommerce Thank You Page
 */
if (!function_exists('gnbmentor_render_workspace_portal_button')) {
    add_action('woocommerce_thankyou', 'gnbmentor_render_workspace_portal_button', 25, 1);
    add_action('woocommerce_order_details_after_order_table', 'gnbmentor_render_workspace_portal_button', 25, 1);

    function gnbmentor_render_workspace_portal_button($order_id) {
        static $rendered = false;
        if ($rendered) return;

        if (!$order_id && isset($_GET['order_id'])) {
            $order_id = absint($_GET['order_id']);
        }
        if (!$order_id) return;

        $order = function_exists('wc_get_order') ? wc_get_order($order_id) : null;
        $order_key      = $order ? $order->get_order_key() : (isset($_GET['key']) ? sanitize_text_field($_GET['key']) : '');
        $customer_email = $order ? $order->get_billing_email() : '';

        $plan_name = '';
        if ($order && method_exists($order, 'get_items')) {
            foreach ($order->get_items() as $item) {
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
        $rendered   = true;
        ?>
        <script>
        document.addEventListener('DOMContentLoaded', function() {
            var existing = document.getElementById('gnbWsSetupCard');
            if (!existing) {
                var placeholder = document.getElementById('gnbMentorFallbackPortalCard');
                if (placeholder) placeholder.style.display = 'block';
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
                Thank you for choosing GNB MENTOR! Your order (Order #<?php echo esc_html($order_id); ?>) is confirmed. Click the button below to complete setup:
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
}

/**
 * 3. Safe WooCommerce Payment Gateway Registration
 */
if (!function_exists('gnbmentor_pay_bootstrap_plugin')) {
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
                    if (!function_exists('wc_get_order')) return array('result' => 'fail');
                    $order = wc_get_order($order_id);
                    if (!$order) return array('result' => 'fail');

                    $amount         = number_format((float)$order->get_total(), 2, '.', '');
                    $currency       = strtoupper($order->get_currency());
                    $timestamp      = time();
                    $order_key      = $order->get_order_key();
                    $customer_name  = trim($order->get_billing_first_name() . ' ' . $order->get_billing_last_name());
                    $customer_email = $order->get_billing_email();

                    $secret    = 'gnbmentor_secure_default_secret_2026';
                    $payload   = "{$order_id}|{$amount}|{$currency}|{$timestamp}";
                    $signature = hash_hmac('sha256', $payload, $secret);

                    $checkout_url = add_query_arg(array(
                        'order_id'       => $order_id,
                        'amount'         => $amount,
                        'currency'       => $currency,
                        'order_key'      => $order_key,
                        'customer_name'  => $customer_name,
                        'customer_email' => $customer_email,
                        'timestamp'      => $timestamp,
                        'signature'      => $signature,
                        'return_url'     => $this->get_return_url($order),
                    ), 'https://pay.gnbmentor.com/checkout');

                    return array(
                        'result'   => 'success',
                        'redirect' => $checkout_url,
                    );
                }
            }
        }

        add_filter('woocommerce_payment_gateways', function ($gateways) {
            $gateways[] = 'WC_Gateway_GNBMentor_Pay';
            return $gateways;
        });
    }
}

/**
 * 4. Helper: Auto-create or retrieve hidden virtual "Domain Registration" WooCommerce product
 */
if (!function_exists('gnbmentor_get_or_create_domain_product')) {
    function gnbmentor_get_or_create_domain_product() {
        $existing = get_posts(array(
            'post_type'      => 'product',
            'post_status'    => 'publish',
            'posts_per_page' => 1,
            'meta_key'       => '_gnb_is_domain_product',
            'meta_value'     => 'yes',
            'fields'         => 'ids',
        ));

        if (!empty($existing)) {
            return $existing[0];
        }

        $product_id = wp_insert_post(array(
            'post_title'   => 'Domain Registration',
            'post_content' => 'Annual domain registration provisioned automatically via Namecheap Reseller API.',
            'post_status'  => 'publish',
            'post_type'    => 'product',
        ));

        if ($product_id && !is_wp_error($product_id)) {
            update_post_meta($product_id, '_gnb_is_domain_product', 'yes');
            update_post_meta($product_id, '_virtual', 'yes');
            update_post_meta($product_id, '_price', '10.98');
            update_post_meta($product_id, '_regular_price', '10.98');
            update_post_meta($product_id, '_visibility', 'hidden');
            if (function_exists('wp_set_object_terms')) {
                wp_set_object_terms($product_id, 'simple', 'product_type');
                wp_set_object_terms($product_id, 'exclude-from-catalog', 'product_visibility');
                wp_set_object_terms($product_id, 'exclude-from-search', 'product_visibility');
            }
            return $product_id;
        }

        return 0;
    }
}

/**
 * 5. 1-Click "Add Domain & Proceed to Checkout" Handler
 */
if (!function_exists('gnbmentor_handle_1click_domain_checkout')) {
    add_action('template_redirect', 'gnbmentor_handle_1click_domain_checkout');

    function gnbmentor_handle_1click_domain_checkout() {
        $domain = '';
        $price  = 10.98;

        if (isset($_GET['gnb_buy_domain']) && !empty($_GET['gnb_buy_domain'])) {
            $domain = sanitize_text_field($_GET['gnb_buy_domain']);
        } elseif (isset($_GET['add-domain']) && !empty($_GET['add-domain'])) {
            $domain = sanitize_text_field($_GET['add-domain']);
        } elseif (isset($_GET['add-to-cart']) && $_GET['add-to-cart'] === 'domain' && isset($_GET['domain'])) {
            $domain = sanitize_text_field($_GET['domain']);
        }

        if (function_exists('get_woocommerce_currency') && get_woocommerce_currency() === 'PKR') {
            if (isset($_GET['pkr']) && is_numeric($_GET['pkr']) && floatval($_GET['pkr']) > 0) {
                $price = floatval($_GET['pkr']);
            } elseif (isset($_GET['price']) && is_numeric($_GET['price'])) {
                $price = round(floatval($_GET['price']) * 280);
            }
        } elseif (isset($_GET['price']) && is_numeric($_GET['price'])) {
            $price = floatval($_GET['price']);
        }

        if (!empty($domain)) {
            if (function_exists('WC') && WC()->cart) {
                $product_id = gnbmentor_get_or_create_domain_product();
                if ($product_id) {
                    WC()->cart->empty_cart();

                    $cart_item_data = array(
                        'gnb_domain_name'  => $domain,
                        'gnb_domain_price' => $price,
                    );

                    WC()->cart->add_to_cart($product_id, 1, 0, array(), $cart_item_data);

                    if (function_exists('is_checkout') && !is_checkout()) {
                        wp_safe_redirect(wc_get_checkout_url());
                        exit;
                    }
                }
            }
        }
    }
}

/**
 * 6. Set Dynamic Domain Price in WooCommerce Cart & Checkout
 */
if (!function_exists('gnbmentor_set_dynamic_domain_price')) {
    add_action('woocommerce_before_calculate_totals', 'gnbmentor_set_dynamic_domain_price', 20, 1);

    function gnbmentor_set_dynamic_domain_price($cart) {
        if (is_admin() && !defined('DOING_AJAX')) return;
        if (did_action('woocommerce_before_calculate_totals') >= 2) return;

        foreach ($cart->get_cart() as $cart_item) {
            if (!empty($cart_item['gnb_domain_price'])) {
                $cart_item['data']->set_price(floatval($cart_item['gnb_domain_price']));
                if (!empty($cart_item['gnb_domain_name'])) {
                    $cart_item['data']->set_name('Domain Registration: ' . $cart_item['gnb_domain_name']);
                }
            }
        }
    }
}

/**
 * 7. Display Domain Name in Cart and Checkout Review
 */
if (!function_exists('gnbmentor_render_domain_cart_meta')) {
    add_filter('woocommerce_get_item_data', 'gnbmentor_render_domain_cart_meta', 10, 2);

    function gnbmentor_render_domain_cart_meta($item_data, $cart_item) {
        if (!empty($cart_item['gnb_domain_name'])) {
            $item_data[] = array(
                'key'   => 'Domain Name',
                'value' => esc_html($cart_item['gnb_domain_name']),
            );
        }
        return $item_data;
    }
}

/**
 * 8. Save Domain to WooCommerce Order Line Item Meta
 */
if (!function_exists('gnbmentor_save_domain_to_order_line')) {
    add_action('woocommerce_checkout_create_order_line_item', 'gnbmentor_save_domain_to_order_line', 10, 4);

    function gnbmentor_save_domain_to_order_line($item, $cart_item_key, $values, $order) {
        if (!empty($values['gnb_domain_name'])) {
            $item->add_meta_data('Domain', $values['gnb_domain_name'], true);
            $item->add_meta_data('_gnb_registered_domain', $values['gnb_domain_name'], true);
            $order->update_meta_data('_gnb_registered_domain', $values['gnb_domain_name']);
        }
    }
}

/**
 * 9. Namecheap-Style Clean White Search Bar Shortcode: [gnb_domain_search]
 */
if (!function_exists('gnbmentor_render_clean_domain_search_widget')) {
    add_shortcode('gnb_domain_search', 'gnbmentor_render_clean_domain_search_widget');

    function gnbmentor_render_clean_domain_search_widget() {
        ob_start();
        ?>
        <div class="gnb-nc-search-container" style="max-width: 860px; margin: 32px auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <div style="display: flex; align-items: center; background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 9999px; padding: 6px 8px 6px 20px; box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.08);">
                <svg style="width: 20px; height: 20px; fill: none; stroke: #94a3b8; stroke-width: 2.2; margin-right: 12px; flex-shrink: 0;" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input type="text" id="gnbDomainSearchInput" placeholder="Find your new domain (e.g. mycompany.com)" 
                       style="flex: 1; border: none; outline: none; background: transparent; font-size: 16px; font-weight: 500; color: #0f172a; min-width: 160px; padding: 10px 0;" />
                <button id="gnbDomainSearchSubmitBtn" 
                        style="display: inline-flex; align-items: center; gap: 8px; padding: 13px 30px; background: #2563eb; color: #ffffff; font-size: 15px; font-weight: 700; border: none; border-radius: 9999px; cursor: pointer; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);">
                    <span>Search</span>
                </button>
            </div>
            <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-top: 14px;">
                <button class="gnb-quick-tld" data-tld="com" style="padding: 5px 14px; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 20px; font-size: 12px; font-weight: 600; color: #475569; cursor: pointer;">.com <span style="color: #2563eb; font-weight: 700;">$10.98</span></button>
                <button class="gnb-quick-tld" data-tld="net" style="padding: 5px 14px; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 20px; font-size: 12px; font-weight: 600; color: #475569; cursor: pointer;">.net <span style="color: #2563eb; font-weight: 700;">$12.98</span></button>
                <button class="gnb-quick-tld" data-tld="org" style="padding: 5px 14px; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 20px; font-size: 12px; font-weight: 600; color: #475569; cursor: pointer;">.org <span style="color: #2563eb; font-weight: 700;">$11.98</span></button>
                <button class="gnb-quick-tld" data-tld="store" style="padding: 5px 14px; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 20px; font-size: 12px; font-weight: 600; color: #475569; cursor: pointer;">.store <span style="color: #16a34a; font-weight: 700;">$4.98</span></button>
                <button class="gnb-quick-tld" data-tld="pk" style="padding: 5px 14px; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 20px; font-size: 12px; font-weight: 600; color: #475569; cursor: pointer;">.pk <span style="color: #2563eb; font-weight: 700;">$14.50</span></button>
            </div>
            <div id="gnbDomainResultDropdown" style="display: none; margin-top: 18px; border-radius: 16px; background: #ffffff; border: 1px solid #e2e8f0; box-shadow: 0 12px 30px -5px rgba(0, 0, 0, 0.08); padding: 20px 24px;"></div>
        </div>
        <script>
        document.addEventListener('DOMContentLoaded', function() {
            var input = document.getElementById('gnbDomainSearchInput');
            var btn = document.getElementById('gnbDomainSearchSubmitBtn');
            var resBox = document.getElementById('gnbDomainResultDropdown');
            var chips = document.querySelectorAll('.gnb-quick-tld');
            if (!input || !btn) return;

            chips.forEach(function(chip) {
                chip.addEventListener('click', function(e) {
                    e.preventDefault();
                    var tld = this.getAttribute('data-tld');
                    var val = input.value.trim().split('.')[0] || 'mycompany';
                    input.value = val + '.' + tld;
                    executeLiveSearch();
                });
            });

            btn.addEventListener('click', function(e) { e.preventDefault(); executeLiveSearch(); });
            input.addEventListener('keypress', function(e) { if (e.key === 'Enter') { e.preventDefault(); executeLiveSearch(); } });

            function executeLiveSearch() {
                var val = input.value.trim();
                if (!val) return;
                resBox.style.display = 'block';
                resBox.innerHTML = '<div style="text-align: center; color: #64748b; font-size: 14px; padding: 12px 0;">Checking Namecheap live registry for <strong>' + val + '</strong>...</div>';

                fetch('https://pay.gnbmentor.com/api/domains/search?domain=' + encodeURIComponent(val))
                    .then(function(res) {
                        var ct = res.headers.get('content-type') || '';
                        if (!ct.includes('application/json')) {
                            throw new Error('Server returned HTML instead of JSON. Ensure pay.gnbmentor.com backend is updated and running.');
                        }
                        return res.json();
                    })
                    .then(function(data) {
                        if (!data.success && data.error) {
                            resBox.innerHTML = '<div style="color: #ef4444; font-size: 14px; text-align: center; padding: 12px 0;">' + data.error + '</div>';
                            return;
                        }
                        if (data.available) {
                            var usdDisplay = data.price || '10.98';
                            var pkrDisplay = data.pkrPrice || Math.round(parseFloat(usdDisplay) * 280);
                            resBox.innerHTML = 
                                '<div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">' +
                                    '<div>' +
                                        '<span style="padding: 3px 10px; background: #dcfce7; border: 1px solid #bbf7d0; border-radius: 20px; color: #16a34a; font-size: 12px; font-weight: 700;">✓ AVAILABLE</span>' +
                                        '<span style="margin-left: 8px; font-size: 18px; font-weight: 800; color: #0f172a;">' + data.domain + '</span>' +
                                        '<p style="margin: 4px 0 0; font-size: 14px; color: #64748b;"><strong style="color: #0f172a; font-size: 17px;">₨ ' + pkrDisplay.toLocaleString() + '</strong> / yr ($' + usdDisplay + ')</p>' +
                                    '</div>' +
                                    '<div style="display: flex; gap: 10px;">' +
                                        '<a href="' + (data.checkoutUrl || ('/?gnb_buy_domain=' + encodeURIComponent(data.domain) + '&price=' + usdDisplay + '&pkr=' + pkrDisplay)) + '" style="padding: 12px 24px; background: #2563eb; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; border-radius: 10px;">Buy Domain &rarr;</a>' +
                                        '<a href="https://portal.gnbmentor.com/register?domain=' + encodeURIComponent(data.domain) + '" style="padding: 12px 18px; background: #f8fafc; border: 1px solid #e2e8f0; color: #334155; text-decoration: none; font-size: 13px; font-weight: 600; border-radius: 10px;">+ Workspace</a>' +
                                    '</div>' +
                                '</div>';
                        } else {
                            resBox.innerHTML = 
                                '<div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">' +
                                    '<div>' +
                                        '<span style="padding: 3px 10px; background: #fee2e2; border: 1px solid #fecaca; border-radius: 20px; color: #dc2626; font-size: 12px; font-weight: 700;">TAKEN</span>' +
                                        '<span style="margin-left: 8px; font-size: 18px; font-weight: 800; color: #0f172a;">' + data.domain + '</span>' +
                                    '</div>' +
                                    '<div><a href="https://portal.gnbmentor.com/register?domain=' + encodeURIComponent(data.domain) + '" style="padding: 11px 20px; background: #0f172a; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; border-radius: 10px;">Connect to Workspace &rarr;</a></div>' +
                                '</div>';
                        }
                    })
                    .catch(function(err) {
                        resBox.innerHTML = '<div style="color: #ef4444; font-size: 14px; text-align: center; padding: 12px 0;">Error checking registry: ' + err.message + '</div>';
                    });
            }
        });
        </script>
        <?php
        return ob_get_clean();
    }
}

/**
 * 10. Automated Namecheap Provisioning Webhook upon Payment Completion
 */
if (!function_exists('gnbmentor_trigger_domain_registration')) {
    add_action('woocommerce_order_status_completed', 'gnbmentor_trigger_domain_registration');
    add_action('woocommerce_order_status_processing', 'gnbmentor_trigger_domain_registration');

    function gnbmentor_trigger_domain_registration($order_id) {
        if (!$order_id || !function_exists('wc_get_order')) return;
        $order = wc_get_order($order_id);
        if (!$order) return;

        $domain = $order->get_meta('_gnb_registered_domain');
        if (empty($domain)) {
            foreach ($order->get_items() as $item) {
                $item_domain = $item->get_meta('Domain');
                if (!empty($item_domain)) {
                    $domain = $item_domain;
                    break;
                }
            }
        }

        if (!empty($domain)) {
            $response = wp_remote_post('https://pay.gnbmentor.com/api/domains/register-order', array(
                'method'    => 'POST',
                'timeout'   => 15,
                'blocking'  => true,
                'headers'   => array('Content-Type' => 'application/json'),
                'body'      => wp_json_encode(array(
                    'order_id'   => $order_id,
                    'domain'     => $domain,
                    'registrant' => array(
                        'firstName' => $order->get_billing_first_name(),
                        'lastName'  => $order->get_billing_last_name(),
                        'email'     => $order->get_billing_email(),
                        'phone'     => $order->get_billing_phone(),
                        'address'   => $order->get_billing_address_1(),
                        'city'      => $order->get_billing_city(),
                        'state'     => $order->get_billing_state(),
                        'postcode'  => $order->get_billing_postcode(),
                        'country'   => $order->get_billing_country(),
                    ),
                )),
            ));

            if (!is_wp_error($response)) {
                $body = json_decode(wp_remote_retrieve_body($response), true);
                if (!empty($body['success'])) {
                    $order->add_order_note(sprintf('Namecheap Reseller API: Successfully registered %s (TxID: %s)', $domain, $body['txId'] ?? 'live'));
                } else {
                    $order->add_order_note(sprintf('Namecheap Reseller API Notice for %s: %s', $domain, $body['message'] ?? 'Pending manual verification'));
                }
            }
        }
    }
}
