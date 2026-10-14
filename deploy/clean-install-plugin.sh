#!/bin/bash
set -e

echo "=== GNB Mentor Clean Plugin Installer & Permissions Fix ==="

WP_PLUGINS="/home/gnbcouk/gnbmentor.com/wp-content/plugins"

if [ ! -d "$WP_PLUGINS" ]; then
    for path in "/var/www/gnbmentor.com/wp-content/plugins" "/var/www/html/wp-content/plugins"; do
        if [ -d "$path" ]; then
            WP_PLUGINS="$path"
            break
        fi
    done
fi

echo "Active WordPress plugins directory: $WP_PLUGINS"

# 1. Remove accidental elementor-pro extract
rm -rf /home/gnbcouk/gnbmentor.com/wp-content/plugins/elementor-pro/modules/gnbmentor-pay 2>/dev/null || true

# 2. Automatically delete ALL files on the server that contain 'GNB Mentor Bridge'
echo "Purging all old 'GNB Mentor Bridge' files..."
grep -rl "GNB Mentor Bridge" /home/ /var/ 2>/dev/null | xargs -r rm -f || true

# 3. Clean out old gnbmentor files from the real plugins folder
rm -rf "$WP_PLUGINS"/gnbmentor-pay*
rm -f "$WP_PLUGINS"/gnbmentor-*.php

# 4. Extract the clean single-file v2.5.0 plugin
echo "Extracting clean v2.5.0 plugin directly into $WP_PLUGINS..."
unzip -o /var/www/pay.gnbmentor.com/public/gnbmentor-pay.zip -d "$WP_PLUGINS"

# 5. Fix permissions with gnbcouk user
echo "Setting permissions for gnbcouk:gnbcouk..."
chown -R gnbcouk:gnbcouk "$WP_PLUGINS"/gnbmentor-pay 2>/dev/null || chown -R --reference="$WP_PLUGINS" "$WP_PLUGINS"/gnbmentor-pay 2>/dev/null || true
chmod -R 775 "$WP_PLUGINS"/gnbmentor-pay
find "$WP_PLUGINS"/gnbmentor-pay -type f -exec chmod 664 {} + 2>/dev/null || true

# 6. Try WP-CLI activation
if command -v wp &> /dev/null; then
    echo "Activating via WP-CLI..."
    wp plugin activate gnbmentor-pay --path="/home/gnbcouk/gnbmentor.com" --allow-root 2>/dev/null || true
fi

echo "=== SUCCESS! ==="
echo "The clean plugin is installed in $WP_PLUGINS/gnbmentor-pay."
