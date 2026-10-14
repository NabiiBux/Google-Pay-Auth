#!/bin/bash
set -e

echo "=== GNB Mentor Clean Plugin Installer & Permissions Fix ==="

# 1. Locate WooCommerce directory to pinpoint the REAL active WordPress plugins folder
WC_PATH=$(find /var/ /home/ -type d -name "woocommerce" 2>/dev/null | head -n 1 || true)

if [ -z "$WC_PATH" ]; then
    echo "Could not find woocommerce folder directly, falling back to standard search..."
    WP_PLUGINS=$(find /var/www /home -type d -name "plugins" 2>/dev/null | grep "wp-content/plugins" | head -n 1 || true)
else
    WP_PLUGINS=$(dirname "$WC_PATH")
fi

if [ -z "$WP_PLUGINS" ]; then
    echo "Error: Could not locate WordPress plugins directory."
    exit 1
fi

echo "Active WordPress plugins directory found: $WP_PLUGINS"

# 2. Automatically delete ALL files on the server that contain 'GNB Mentor Bridge'
echo "Deleting all old 'GNB Mentor Bridge' files from plugins..."
grep -rl "GNB Mentor Bridge" /var/ /home/ 2>/dev/null | grep "wp-content/plugins" | xargs -r rm -f || true

# 3. Remove any old gnbmentor-pay and gnbmentor-wc-gateway folders in wp-content/plugins
rm -rf "$WP_PLUGINS"/gnbmentor-pay*
rm -rf "$WP_PLUGINS"/gnbmentor-wc-gateway*
rm -f "$WP_PLUGINS"/gnbmentor-*.php

# 4. Extract the clean single-file v2.5.0 plugin
echo "Extracting clean v2.5.0 plugin into $WP_PLUGINS..."
unzip -o /var/www/pay.gnbmentor.com/public/gnbmentor-pay.zip -d "$WP_PLUGINS"

# 5. Inherit exact ownership from the woocommerce folder
echo "Setting permissions..."
if [ -n "$WC_PATH" ]; then
    chown -R --reference="$WC_PATH" "$WP_PLUGINS"/gnbmentor-pay 2>/dev/null || true
fi
chmod -R 775 "$WP_PLUGINS"/gnbmentor-pay
find "$WP_PLUGINS"/gnbmentor-pay -type f -exec chmod 664 {} + 2>/dev/null || true

# 6. Try WP-CLI activation if installed
WP_DIR=$(dirname $(dirname "$WP_PLUGINS"))
if command -v wp &> /dev/null; then
    echo "Activating via WP-CLI..."
    wp plugin activate gnbmentor-pay --path="$WP_DIR" --allow-root || true
fi

echo "=== SUCCESS! ==="
echo "The duplicate 'GNB Mentor Bridge v2.4.0' entries have been deleted."
echo "The clean 'GNB Mentor Pay & Domain Gateway v2.5.0' plugin is installed in $WP_PLUGINS/gnbmentor-pay."
