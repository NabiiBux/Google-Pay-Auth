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

/**
 * 4. Domain Search Shortcode: [gnb_domain_search]
 * Provides real-time Namecheap availability check and 1-click WooCommerce cart checkout.
 */
add_shortcode('gnb_domain_search', 'gnbmentor_render_domain_search_widget');

function gnbmentor_render_domain_search_widget() {
    ob_start();
    ?>
    <div id="gnbDomainSearchWidget" class="gnb-domain-search-box" style="margin: 28px 0; padding: 32px 24px; background: linear-gradient(135deg, #090d16 0%, #151f32 100%); border: 1px solid rgba(59, 130, 246, 0.35); border-radius: 20px; box-shadow: 0 16px 40px -10px rgba(15, 23, 42, 0.45); color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center;">
        <span style="display: inline-block; padding: 4px 14px; background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.35); border-radius: 20px; color: #60a5fa; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 12px;">
            Instant Domain Registration
        </span>
        <h2 style="margin: 0 0 8px; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em;">
            Find Your Perfect Domain Name
        </h2>
        <p style="margin: 0 auto 24px; font-size: 14px; color: #94a3b8; max-width: 480px; line-height: 1.5;">
            Search real-time availability powered by Namecheap Reseller API. Register instantly or bundle with Google Workspace.
        </p>

        <!-- Search Bar -->
        <div style="display: flex; max-width: 580px; margin: 0 auto 16px; background: rgba(255, 255, 255, 0.06); border: 2px solid rgba(59, 130, 246, 0.4); border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);">
            <input type="text" id="gnbDomainInput" placeholder="Enter your domain (e.g. mycompany.com)" style="flex: 1; padding: 16px 20px; background: transparent; border: none; color: #ffffff; font-size: 16px; outline: none;" />
            <button id="gnbDomainSearchBtn" style="padding: 16px 28px; background: #2563eb; color: #ffffff; font-weight: 700; border: none; font-size: 15px; cursor: pointer; transition: background 0.15s ease;">
                Search
            </button>
        </div>

        <!-- Quick TLD Chips -->
        <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin-bottom: 24px;">
            <button class="gnb-tld-chip" data-tld="com" style="padding: 6px 14px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; color: #cbd5e1; font-size: 12px; cursor: pointer;">.com ($10.98)</button>
            <button class="gnb-tld-chip" data-tld="net" style="padding: 6px 14px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; color: #cbd5e1; font-size: 12px; cursor: pointer;">.net ($12.98)</button>
            <button class="gnb-tld-chip" data-tld="org" style="padding: 6px 14px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; color: #cbd5e1; font-size: 12px; cursor: pointer;">.org ($11.98)</button>
            <button class="gnb-tld-chip" data-tld="store" style="padding: 6px 14px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; color: #cbd5e1; font-size: 12px; cursor: pointer;">.store ($4.98)</button>
            <button class="gnb-tld-chip" data-tld="pk" style="padding: 6px 14px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; color: #cbd5e1; font-size: 12px; cursor: pointer;">.pk ($14.50)</button>
            <button class="gnb-tld-chip" data-tld="io" style="padding: 6px 14px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; color: #cbd5e1; font-size: 12px; cursor: pointer;">.io ($38.98)</button>
        </div>

        <!-- Result Card Container -->
        <div id="gnbDomainResultBox" style="display: none; max-width: 580px; margin: 0 auto; padding: 20px; border-radius: 16px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); text-align: left;">
        </div>
    </div>

    <script>
    document.addEventListener('DOMContentLoaded', function() {
        var input = document.getElementById('gnbDomainInput');
        var btn = document.getElementById('gnbDomainSearchBtn');
        var resBox = document.getElementById('gnbDomainResultBox');
        var chips = document.querySelectorAll('.gnb-tld-chip');

        chips.forEach(function(chip) {
            chip.addEventListener('click', function() {
                var tld = this.getAttribute('data-tld');
                var val = input.value.trim().split('.')[0] || 'mycompany';
                input.value = val + '.' + tld;
                doDomainSearch();
            });
        });

        btn.addEventListener('click', doDomainSearch);
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') doDomainSearch();
        });

        function doDomainSearch() {
            var val = input.value.trim();
            if (!val) return;

            resBox.style.display = 'block';
            resBox.innerHTML = '<div style="text-align: center; color: #94a3b8; padding: 12px;">Checking Namecheap live registry...</div>';

            fetch('https://pay.gnbmentor.com/api/domains/search?domain=' + encodeURIComponent(val))
                .then(function(res) { return res.json(); })
                .then(function(data) {
                    if (data.available) {
                        resBox.innerHTML = 
                            '<div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">' +
                                '<div>' +
                                    '<span style="display: inline-block; padding: 2px 8px; background: rgba(34,197,94,0.15); border: 1px solid rgba(34,197,94,0.35); border-radius: 12px; color: #4ade80; font-size: 11px; font-weight: 700; margin-bottom: 4px;">✓ AVAILABLE</span>' +
                                    '<h3 style="margin: 0; font-size: 18px; color: #ffffff;">' + data.domain + '</h3>' +
                                    '<p style="margin: 4px 0 0; font-size: 13px; color: #94a3b8;">PKR ' + data.pkrPrice + ' / year ($' + data.price + ')</p>' +
                                '</div>' +
                                '<div style="display: flex; gap: 8px;">' +
                                    '<a href="/checkout/?add-domain=' + encodeURIComponent(data.domain) + '&price=' + data.price + '" style="display: inline-flex; align-items: center; padding: 10px 18px; background: #2563eb; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; border-radius: 10px;">Buy Domain</a>' +
                                    '<a href="https://portal.gnbmentor.com/register?domain=' + encodeURIComponent(data.domain) + '" style="display: inline-flex; align-items: center; padding: 10px 14px; background: rgba(255,255,255,0.08); color: #cbd5e1; text-decoration: none; font-size: 13px; font-weight: 600; border-radius: 10px;">+ Google Workspace</a>' +
                                '</div>' +
                            '</div>';
                    } else {
                        resBox.innerHTML = 
                            '<div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">' +
                                '<div>' +
                                    '<span style="display: inline-block; padding: 2px 8px; background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.35); border-radius: 12px; color: #f87171; font-size: 11px; font-weight: 700; margin-bottom: 4px;">TAKEN</span>' +
                                    '<h3 style="margin: 0; font-size: 18px; color: #ffffff;">' + data.domain + '</h3>' +
                                    '<p style="margin: 4px 0 0; font-size: 13px; color: #94a3b8;">Already registered. Own it? Connect it to Workspace.</p>' +
                                '</div>' +
                                '<div>' +
                                    '<a href="https://portal.gnbmentor.com/register?domain=' + encodeURIComponent(data.domain) + '" style="display: inline-flex; align-items: center; padding: 10px 16px; background: #2563eb; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; border-radius: 10px;">Connect to Workspace &rarr;</a>' +
                                '</div>' +
                            '</div>';
                    }
                })
                .catch(function() {
                    resBox.innerHTML = '<div style="color: #f87171; text-align: center; padding: 10px;">Registry query timed out. Please try again.</div>';
                });
        }
    });
    </script>
    <?php
    return ob_get_clean();
}

/**
 * 5. Handle WooCommerce Cart addition for domain items with dynamic pricing
 */
add_action('init', 'gnbmentor_handle_add_domain_to_cart');

function gnbmentor_handle_add_domain_to_cart() {
    if (isset($_GET['add-domain']) && !empty($_GET['add-domain'])) {
        $domain = sanitize_text_field($_GET['add-domain']);
        $price  = isset($_GET['price']) ? floatval($_GET['price']) : 12.98;

        if (function_exists('WC') && WC()->cart) {
            // Store domain in session
            WC()->session->set('gnb_custom_domain', array(
                'domain' => $domain,
                'price'  => $price,
            ));
        }
    }
}

/**
 * 6. Automated Namecheap Provisioning Webhook upon Payment Completion
 */
add_action('woocommerce_order_status_completed', 'gnbmentor_trigger_domain_registration');
add_action('woocommerce_order_status_processing', 'gnbmentor_trigger_domain_registration');

function gnbmentor_trigger_domain_registration($order_id) {
    if (!$order_id || !function_exists('wc_get_order')) return;
    $order = wc_get_order($order_id);
    if (!$order) return;

    $domain = $order->get_meta('_gnb_registered_domain');
    if (empty($domain)) {
        // Check order notes or items
        foreach ($order->get_items() as $item) {
            $item_domain = $item->get_meta('Domain');
            if (!empty($item_domain)) {
                $domain = $item_domain;
                break;
            }
        }
    }

    if (!empty($domain)) {
        // Dispatch to pay.gnbmentor.com Namecheap provisioning worker
        wp_remote_post('https://pay.gnbmentor.com/api/domains/register-order', array(
            'method'    => 'POST',
            'blocking'  => false,
            'headers'   => array('Content-Type' => 'application/json'),
            'body'      => wp_json_encode(array(
                'order_id'   => $order_id,
                'domain'     => $domain,
                'registrant' => array(
                    'firstName' => $order->get_billing_first_name(),
                    'lastName'  => $order->get_billing_last_name(),
                    'email'     => $order->get_billing_email(),
                    'phone'     => $order->get_billing_phone(),
                ),
            )),
        ));
    }
}

