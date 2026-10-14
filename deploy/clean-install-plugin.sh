#!/bin/bash
set -e

echo "=== GNB Mentor Clean Plugin Installer & Permissions Fix ==="

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
    echo "Error: Could not locate WordPress wp-content/plugins directory."
    exit 1
fi

echo "Found WordPress plugins at: $WP_PLUGINS"

# 2. Force remove the stuck/locked files that WordPress couldn't delete
echo "Removing locked/stuck files..."
rm -rf "$WP_PLUGINS"/gnbmentor-pay*
rm -f "$WP_PLUGINS"/gnbmentor-*.php

# 3. Extract the clean single-file v2.5.0 plugin
echo "Extracting clean v2.5.0 plugin..."
unzip -o /var/www/pay.gnbmentor.com/public/gnbmentor-pay.zip -d "$WP_PLUGINS"

# 4. Copy exact owner and group from parent plugins folder
echo "Inheriting exact WordPress filesystem ownership..."
chown -R --reference="$WP_PLUGINS" "$WP_PLUGINS"/gnbmentor-pay
chmod -R 775 "$WP_PLUGINS"/gnbmentor-pay
find "$WP_PLUGINS"/gnbmentor-pay -type f -exec chmod 664 {} +

# 5. Try WP-CLI activation if installed
WP_DIR=$(dirname $(dirname "$WP_PLUGINS"))
if command -v wp &> /dev/null; then
    echo "Activating plugin via WP-CLI..."
    wp plugin activate gnbmentor-pay --path="$WP_DIR" --allow-root || true
fi

echo "=== SUCCESS! ==="
echo "Plugin is cleanly installed with full permissions in $WP_PLUGINS/gnbmentor-pay."
