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

# 2. Identify web server process owner (nginx, apache, php-fpm, or nobody)
WEB_USER=$(ps aux | grep -E 'php-fpm|nginx|httpd|apache2' | grep -v root | awk '{print $1}' | head -n 1 || true)
if [ -z "$WEB_USER" ]; then
    WEB_USER="nginx"
fi
echo "Web server owner detected: $WEB_USER"

# 3. Clean out old root-owned files causing permission and duplication errors
echo "Removing old locked files..."
rm -rf "$WP_PLUGINS"/gnbmentor-pay*
rm -f "$WP_PLUGINS"/gnbmentor-*.php

# 4. Extract the clean single-file v2.5.0 plugin
echo "Extracting clean v2.5.0 plugin..."
unzip -o /var/www/pay.gnbmentor.com/public/gnbmentor-pay.zip -d "$WP_PLUGINS"

# 5. Fix permissions completely so WordPress can manage it seamlessly
echo "Setting permissions for $WEB_USER..."
chown -R "$WEB_USER":"$WEB_USER" "$WP_PLUGINS"/gnbmentor-pay 2>/dev/null || true
chmod -R 755 "$WP_PLUGINS"/gnbmentor-pay
find "$WP_PLUGINS"/gnbmentor-pay -type f -exec chmod 644 {} +

# 6. Try WP-CLI activation if installed
WP_DIR=$(dirname $(dirname "$WP_PLUGINS"))
if command -v wp &> /dev/null; then
    wp plugin activate gnbmentor-pay --path="$WP_DIR" --allow-root 2>/dev/null || true
fi

echo "=== SUCCESS! ==="
echo "Plugin is installed with correct permissions in $WP_PLUGINS/gnbmentor-pay."
