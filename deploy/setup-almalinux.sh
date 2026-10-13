#!/usr/bin/env bash
# ==============================================================================
# AlmaLinux VPS Setup & Deployment Script for pay.gnbmentor.com
# Compatible with AlmaLinux 8 / 9, RHEL 8 / 9, Rocky Linux
# ==============================================================================

set -e

echo "=== [1/6] Updating System & Installing Prerequisites ==="
dnf update -y
dnf install -y git curl wget nginx epel-release certbot python3-certbot-nginx

echo "=== [2/6] Installing Node.js 20 LTS ==="
dnf module reset nodejs -y || true
dnf module enable nodejs:20 -y
dnf install -y nodejs
node -v
npm -v

echo "=== [3/6] Installing PM2 Process Manager ==="
npm install -g pm2
pm2 startup systemd -u root --hp /root || true

echo "=== [4/6] Configuring AlmaLinux Firewalld & SELinux ==="
systemctl enable --now firewalld || true
firewall-cmd --permanent --add-service=http || true
firewall-cmd --permanent --add-service=https || true
firewall-cmd --permanent --add-port=3000/tcp || true
firewall-cmd --reload || true

# CRITICAL for AlmaLinux: Allow Nginx to connect to upstream Node.js socket/port
setsebool -P httpd_can_network_connect 1

echo "=== [5/6] Setting Up Project Directory ==="
mkdir -p /var/www/pay.gnbmentor.com
mkdir -p /var/log/pm2

echo "=== [6/6] Next Steps: ==="
echo "1. Clone your GitHub repository:"
echo "   git clone <YOUR_GITHUB_REPO_URL> /var/www/pay.gnbmentor.com"
echo "2. Create production .env:"
echo "   cp /var/www/pay.gnbmentor.com/.env.example /var/www/pay.gnbmentor.com/.env"
echo "   nano /var/www/pay.gnbmentor.com/.env"
echo "3. Install packages & build frontend:"
echo "   cd /var/www/pay.gnbmentor.com"
echo "   npm install"
echo "   npm run build"
echo "4. Copy Nginx virtual host:"
echo "   cp deploy/nginx.conf /etc/nginx/conf.d/pay.gnbmentor.com.conf"
echo "   nginx -t && systemctl restart nginx"
echo "5. Issue SSL Certificate with Certbot:"
echo "   certbot --nginx -d pay.gnbmentor.com"
echo "6. Launch via PM2:"
echo "   pm2 start deploy/ecosystem.config.cjs --env production"
echo "   pm2 save"
echo "=========================================================="
