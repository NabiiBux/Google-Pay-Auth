# Unified AlmaLinux VPS Architecture Plan (portal.gnbmentor.com + pay.gnbmentor.com + gnbmentor.com)

A revised, high-performance integration and deployment blueprint designed specifically for your **Namecheap AlmaLinux VPS**. Because **gnbmentor.com** (WordPress/WooCommerce), **pay.gnbmentor.com** (Google Pay & Stripe portal), and **portal.gnbmentor.com** (Google Workspace & Namecheap Reseller admin backend) are all co-hosted on the **same physical VPS**, we can leverage high-speed internal localhost IPC, unified Nginx virtual hosting, consolidated PM2 process management, and simplified Namecheap API IP whitelisting.

---

## User Review & Confirmed Architectural Parameters

> [!IMPORTANT]
> The following parameters are locked and confirmed:
> 1. **Co-Hosting Environment**: Single **AlmaLinux VPS hosted on Namecheap**.
> 2. **Virtual Host Topography**:
>    - `gnbmentor.com`: WordPress + WooCommerce (PHP-FPM, port 80/443).
>    - `pay.gnbmentor.com`: Node.js Express + Vite, PM2 instance (`http://127.0.0.1:3000`).
>    - `portal.gnbmentor.com`: Node.js Express + Vite, PM2 instance (`http://127.0.0.1:3001`).
> 3. **Inter-Service Communication**: Instant internal localhost webhook dispatch (`http://127.0.0.1:3001/api/internal/order-paid`), bypassing external internet routing and Cloudflare firewall bottlenecks.
> 4. **Namecheap Reseller API**: Whitelisted directly to the VPS's public static IP address on Namecheap.
> 5. **Google Workspace Automation**: Partner Sales Console / Reseller API service account running on `portal.gnbmentor.com` to provision Workspace accounts and auto-enable Google Maps Platform APIs.

---

## 1. Single-VPS Server Layout & Routing Architecture

```
                                  INTERNET
                                      │
                   ┌──────────────────┴──────────────────┐
                   │   Namecheap AlmaLinux VPS (Single)  │
                   │           Nginx (Reverse Proxy)     │
                   └──────────────────┬──────────────────┘
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        │                             │                             │
        ▼                             ▼                             ▼
https://gnbmentor.com       https://pay.gnbmentor.com     https://portal.gnbmentor.com
(WordPress/WooCommerce)      (Google Pay & Stripe)         (Workspace Reseller Admin)
   PHP-FPM FastCGI              Node.js (Port 3000)           Node.js (Port 3001)
  /var/www/gnbmentor.com        /var/www/pay.gnb...           /var/www/portal.gnb...
        │                             │                             ▲
        │ (Signed Redirect)           │ (Internal Localhost Webhook)│
        └────────────────────────────>│ 127.0.0.1:3001 ─────────────┘
```

### Advantages of Co-Hosting on the Same Namecheap VPS:
1. **Sub-Millisecond Webhook Delivery**: When a payment completes on `pay.gnbmentor.com`, it triggers `http://127.0.0.1:3001/api/internal/order-paid` instantly over the loopback interface without external network hops or DNS lookups.
2. **Zero Cloudflare Webhook Blocking**: Since the dispatch is internal, Cloudflare WAF or bot challenges will never drop the order notification between payment and provisioning.
3. **Effortless Namecheap API Whitelisting**: Because the server is hosted on Namecheap, its public IP is a verified Namecheap network IP, making API authorization in the Namecheap Profile console immediate.
4. **Consolidated PM2 & SSL Operations**: A single `ecosystem.config.cjs` manages both Node.js services, and Certbot handles multi-domain SSL renewal under one cron job.

---

## 2. End-to-End Customer Journey & Workflow

```
[Customer on gnbmentor.com]
         │
         │ 1. Buys Workspace Plan (e.g. Business Starter) + Optional Domain
         ▼
[Redirect to pay.gnbmentor.com]
         │
         │ 2. Authorizes with Google Pay (Approved Profile) or Credit Card
         ▼
[Stripe Charges Customer]
         │
         ├───> 3a. Updates WooCommerce Order status -> "Processing"
         │
         └───> 3b. Fires Local Webhook to 127.0.0.1:3001 (Portal)
                     │
                     ▼
[portal.gnbmentor.com Creates Session]
         │
         │ 4. Returns single-use onboarding URL:
         │    portal.gnbmentor.com/onboard?token=gws_...
         ▼
[pay.gnbmentor.com Success Screen]
         │
         │ 5. Displays high-priority action:
         │    "Set Up Google Workspace Users Now →"
         ▼
[Customer Lands on portal.gnbmentor.com/onboard]
         │
         ├── If they have a domain: Enter domain -> DNS check
         │
         └── If they need a domain: Namecheap Live Search -> Register -> Auto DNS
                     │
                     ▼
[Backend Automated Provisioning]
         │
         ├── Calls Google Partner Sales Console / Reseller API
         ├── Creates Workspace Tenant & Admin User (@domain)
         ├── Binds Google Cloud Project & Enables Google Maps APIs
         └── Configures Namecheap DNS (MX, SPF, Google Verification)
                     │
                     ▼
[Handover Complete]
         Customer receives admin.google.com credentials & Maps API key
```

---

## 3. Namecheap Reseller API Integration (Backend Service)

Because your VPS is hosted on Namecheap, the Namecheap API works natively from your server's public IP.

### Configuration (`/var/www/portal.gnbmentor.com/.env`):
```env
# Namecheap Reseller API
NAMECHEAP_API_USER="your_namecheap_username"
NAMECHEAP_API_KEY="your_api_key_from_namecheap_profile"
NAMECHEAP_CLIENT_IP="your_vps_public_ip"
NAMECHEAP_SANDBOX=false

# Internal IPC Security
INTERNAL_SECRET_KEY="gnbmentor_internal_vps_secret_2026"

# Google Partner Console & Reseller
GOOGLE_APPLICATION_CREDENTIALS="/var/www/portal.gnbmentor.com/config/google-service-account.json"
GOOGLE_RESELLER_CUSTOMER_ID="C0xxxxxxx"
```

### Namecheap API Commands Implemented:
1. `namecheap.domains.check`: Checks domain availability in real-time as the customer types.
2. `namecheap.domains.create`: Registers the new domain under your wholesale reseller balance without exposing Namecheap credentials to the user.
3. `namecheap.domains.dns.setHosts`: Injects the required Google Workspace DNS records into Namecheap DNS automatically:
   - **MX Records**: `1 SMTP.GOOGLE.COM`
   - **SPF TXT**: `v=spf1 include:_spf.google.com ~all`
   - **Google Verification**: `google-site-verification=...`

---

## 4. Google Partner Sales Console & Google Maps Platform Integration

Running inside the `portal.gnbmentor.com` backend service:

1. **Google Partner Sales Console (Reseller API)**:
   - Uses Google Service Account with Domain-Wide Delegation.
   - Creates customer account via `customers.insert`.
   - Creates Workspace subscription via `subscriptions.insert` for the target SKU (`Google-Workspace-Business-Starter`, `Standard`, etc.).
2. **Automated Google Maps Platform API Provisioning**:
   - Creates a Google Cloud project linked to your partner billing account.
   - Calls Google Service Usage API (`serviceusage.services.enable`):
     - `maps-backend.googleapis.com` (Maps JavaScript API)
     - `geocoding-backend.googleapis.com` (Geocoding API)
     - `places-backend.googleapis.com` (Places API)
   - Creates a browser-restricted API key restricted to the customer's domain (`*.customerdomain.com/*`).

---

## 5. Nginx & PM2 Unified Configuration for the Namecheap VPS

### Nginx Virtual Hosts (`/etc/nginx/conf.d/gnbmentor.conf`):
```nginx
# 1. Main WordPress Store
server {
    server_name gnbmentor.com www.gnbmentor.com;
    root /var/www/gnbmentor.com;
    index index.php;
    location / { try_files $uri $uri/ /index.php?$args; }
    location ~ \.php$ {
        include fastcgi_params;
        fastcgi_pass unix:/run/php-fpm/www.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }
}

# 2. Payment Gateway Portal
server {
    server_name pay.gnbmentor.com;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

# 3. Reseller & Provisioning Portal
server {
    server_name portal.gnbmentor.com;
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### Unified PM2 Process Manager (`ecosystem.config.cjs`):
```javascript
module.exports = {
  apps: [
    {
      name: 'gnbmentor-pay',
      cwd: '/var/www/pay.gnbmentor.com',
      script: 'server.ts',
      interpreter: 'tsx',
      env: { PORT: 3000, NODE_ENV: 'production' },
    },
    {
      name: 'gnbmentor-portal',
      cwd: '/var/www/portal.gnbmentor.com',
      script: 'server.ts',
      interpreter: 'tsx',
      env: { PORT: 3001, NODE_ENV: 'production' },
    },
  ],
};
```

---

## 6. Implementation Stages & Execution Order

| Stage | Focus | Action Items |
| :--- | :--- | :--- |
| **Phase 1** | Payment Dispatch & Handoff | Update `pay.gnbmentor.com` to fire internal webhook to `http://127.0.0.1:3001/api/internal/order-paid` upon Stripe confirmation. Add "Set Up Google Workspace Users Now" button on success screen. |
| **Phase 2** | Portal Backend & Namecheap API | Set up `/var/www/portal.gnbmentor.com` with Express, Namecheap Reseller XML client (`domains.check`, `domains.create`, `dns.setHosts`), and internal order session store. |
| **Phase 3** | Google Partner Console & Maps API | Integrate Google Service Account with Partner Sales Console Reseller API and Cloud Service Usage API for automated Maps API enablement. |
| **Phase 4** | Portal Onboarding UI | Build the customer onboarding wizard on `portal.gnbmentor.com` (Domain Search, Admin Account creation, and DNS configuration card). |
| **Phase 5** | Nginx & PM2 Deployment | Configure `/etc/nginx/conf.d/` virtual hosts for port 3000 and 3001, issue Let's Encrypt SSL certificates, and start both apps under PM2. |
