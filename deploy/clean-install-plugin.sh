#!/bin/bash
set -e

echo "=== GNB Mentor Clean Plugin Installer ==="

# 1. Locate WordPress plugins directory
WP_PLUGINS=""
for path in "/var/www/gnbmentor.com/wp-content/plugins" "/var/www/html/wp-content/plugins" "/home/gnbmentor/public_html/wp-content/plugins" "/var/www/vhosts/gnbmentor.com/httpdocs/wp-content/plugins"; do
    if [ -d "$path" ]; then
        WP_PLUGINS="$path"
        break
    fi
done

if [ -z "$WP_PLUGINS" ]; then
    WP_PLUGINS=$(find /var/www /home -type d -name "plugins" 2>/dev/null | grep "wp-content/plugins" | head -n 1 || true)
fi

if [ -z "$WP_PLUGINS" ]; then
    echo "Error: Could not locate WordPress wp-content/plugins directory automatically."
    exit 1
fi

echo "Found WordPress plugins at: $WP_PLUGINS"

# 2. Remove all old duplicate loose files causing the 2x listing and fatal error
echo "Removing old duplicate files..."
rm -f "$WP_PLUGINS"/gnbmentor-wc-gateway.php
rm -f "$WP_PLUGINS"/gnbmentor-pay.php
rm -rf "$WP_PLUGINS"/gnbmentor-pay
rm -rf "$WP_PLUGINS"/gnbmentor-wc-gateway

# 3. Extract the clean single-file v2.5.0 plugin
echo "Extracting clean v2.5.0 plugin..."
unzip -o /var/www/pay.gnbmentor.com/public/gnbmentor-pay.zip -d "$WP_PLUGINS"

# 4. Fix permissions
chown -R nginx:nginx "$WP_PLUGINS"/gnbmentor-pay 2>/dev/null || chown -R apache:apache "$WP_PLUGINS"/gnbmentor-pay 2>/dev/null || true

echo "=== SUCCESS! ==="
echo "Clean plugin installed in $WP_PLUGINS/gnbmentor-pay."
