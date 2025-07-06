# 🚀 Panduan Deploy Aplikasi Akuntansi Keuangan ke VPS

## 📋 **Persiapan VPS**

### **1. Spesifikasi VPS Minimum:**
- **RAM:** 1GB (Recommended: 2GB+)
- **Storage:** 20GB SSD
- **OS:** Ubuntu 20.04/22.04 LTS atau CentOS 8+
- **Bandwidth:** Unlimited atau minimal 1TB/bulan

### **2. Software yang Dibutuhkan:**
- Node.js 18+ 
- npm atau yarn
- Nginx (Web Server)
- PM2 (Process Manager)
- Git
- SSL Certificate (Let's Encrypt)

---

## 🛠️ **Setup VPS (Ubuntu)**

### **1. Update System:**
```bash
sudo apt update && sudo apt upgrade -y
```

### **2. Install Node.js 18:**
```bash
# Install Node.js 18 via NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version
```

### **3. Install PM2 (Process Manager):**
```bash
sudo npm install -g pm2
```

### **4. Install Nginx:**
```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### **5. Install Git:**
```bash
sudo apt install git -y
```

---

## 📁 **Deploy Aplikasi**

### **1. Clone Repository:**
```bash
# Masuk ke direktori web
cd /var/www

# Clone project (ganti dengan URL repo Anda)
sudo git clone https://github.com/username/akuntansi-keuangan.git
sudo chown -R $USER:$USER akuntansi-keuangan
cd akuntansi-keuangan
```

### **2. Install Dependencies:**
```bash
npm install
```

### **3. Setup Environment Variables:**
```bash
# Copy environment file
cp .env.example .env

# Edit environment file
nano .env
```

**Isi file `.env`:**
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://ddtwsrfrfywgrqxxvsso.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkdHdzcmZyZnl3Z3JxeHh2c3NvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MjExNjYsImV4cCI6MjA2NzM5NzE2Nn0.BUixetXNsej6oDI93tp388xk_S2l2DhfFgEjpYgq2VE

# Production Settings
NODE_ENV=production
PORT=3000
```

### **4. Build Aplikasi:**
```bash
npm run build
```

### **5. Setup PM2:**
```bash
# Buat file ecosystem PM2
nano ecosystem.config.js
```

**Isi file `ecosystem.config.js`:**
```javascript
module.exports = {
  apps: [{
    name: 'akuntansi-keuangan',
    script: 'npm',
    args: 'run preview',
    cwd: '/var/www/akuntansi-keuangan',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

### **6. Buat Direktori Logs:**
```bash
mkdir logs
```

### **7. Start Aplikasi dengan PM2:**
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## 🌐 **Setup Nginx**

### **1. Buat Konfigurasi Nginx:**
```bash
sudo nano /etc/nginx/sites-available/akuntansi-keuangan
```

**Isi konfigurasi:**
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;  # Ganti dengan domain Anda
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;  # Ganti dengan domain Anda
    
    # SSL Configuration (akan disetup dengan Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Security
    location ~ /\. {
        deny all;
    }
}
```

### **2. Enable Site:**
```bash
sudo ln -s /etc/nginx/sites-available/akuntansi-keuangan /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

---

## 🔒 **Setup SSL Certificate (Let's Encrypt)**

### **1. Install Certbot:**
```bash
sudo apt install snapd -y
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
```

### **2. Obtain SSL Certificate:**
```bash
# Ganti your-domain.com dengan domain Anda
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

### **3. Auto-renewal:**
```bash
sudo crontab -e
```

**Tambahkan line berikut:**
```bash
0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 🔧 **Konfigurasi Firewall**

### **1. Setup UFW:**
```bash
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw status
```

---

## 📊 **Monitoring & Maintenance**

### **1. Monitor PM2:**
```bash
pm2 status          # Lihat status aplikasi
pm2 logs            # Lihat logs
pm2 monit           # Monitor real-time
pm2 restart all     # Restart aplikasi
```

### **2. Update Aplikasi:**
```bash
cd /var/www/akuntansi-keuangan
git pull origin main
npm install
npm run build
pm2 restart akuntansi-keuangan
```

### **3. Backup Database:**
```bash
# Backup otomatis Supabase sudah tersedia
# Atau export manual dari Supabase Dashboard
```

---

## 🚀 **Alternative: Deploy dengan Docker**

### **1. Buat Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "preview"]
```

### **2. Buat docker-compose.yml:**
```yaml
version: '3.8'
services:
  akuntansi-app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
      - VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs
```

### **3. Deploy dengan Docker:**
```bash
docker-compose up -d
```

---

## 🔍 **Troubleshooting**

### **1. Aplikasi tidak bisa diakses:**
```bash
# Cek status PM2
pm2 status

# Cek logs
pm2 logs

# Cek Nginx
sudo nginx -t
sudo systemctl status nginx

# Cek firewall
sudo ufw status
```

### **2. SSL Certificate Error:**
```bash
# Renew certificate
sudo certbot renew

# Check certificate
sudo certbot certificates
```

### **3. Performance Issues:**
```bash
# Monitor resources
htop
df -h
free -m

# Restart services
pm2 restart all
sudo systemctl restart nginx
```

---

## 📈 **Optimasi Performance**

### **1. Enable Nginx Caching:**
```nginx
# Tambahkan di konfigurasi Nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=10g 
                 inactive=60m use_temp_path=off;

location / {
    proxy_cache my_cache;
    proxy_cache_revalidate on;
    proxy_cache_min_uses 3;
    proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
    proxy_cache_background_update on;
    proxy_cache_lock on;
    
    # ... rest of proxy config
}
```

### **2. Setup CDN (Optional):**
- Cloudflare (Free)
- AWS CloudFront
- DigitalOcean Spaces CDN

---

## 💰 **Estimasi Biaya VPS**

### **Provider Rekomendasi:**

1. **DigitalOcean Droplet:**
   - 1GB RAM, 1 vCPU, 25GB SSD: **$6/bulan**
   - 2GB RAM, 1 vCPU, 50GB SSD: **$12/bulan**

2. **Vultr:**
   - 1GB RAM, 1 vCPU, 25GB SSD: **$6/bulan**
   - 2GB RAM, 1 vCPU, 55GB SSD: **$12/bulan**

3. **Linode:**
   - 1GB RAM, 1 vCPU, 25GB SSD: **$5/bulan**
   - 2GB RAM, 1 vCPU, 50GB SSD: **$10/bulan**

4. **AWS Lightsail:**
   - 1GB RAM, 1 vCPU, 40GB SSD: **$5/bulan**
   - 2GB RAM, 1 vCPU, 60GB SSD: **$10/bulan**

---

## ✅ **Checklist Deploy**

- [ ] VPS setup dan update
- [ ] Node.js 18+ installed
- [ ] PM2 installed
- [ ] Nginx installed dan configured
- [ ] Repository cloned
- [ ] Dependencies installed
- [ ] Environment variables configured
- [ ] Application built
- [ ] PM2 ecosystem configured
- [ ] Application started dengan PM2
- [ ] Nginx site configured
- [ ] SSL certificate installed
- [ ] Firewall configured
- [ ] Domain pointed ke VPS IP
- [ ] Application accessible via domain
- [ ] Monitoring setup

---

## 🎯 **Hasil Akhir**

Setelah mengikuti panduan ini, Anda akan memiliki:

✅ **Aplikasi akuntansi keuangan** yang berjalan di VPS  
✅ **HTTPS/SSL** untuk keamanan  
✅ **Auto-restart** jika aplikasi crash  
✅ **Nginx reverse proxy** untuk performance  
✅ **Monitoring** dengan PM2  
✅ **Auto SSL renewal** dengan Let's Encrypt  

**🌐 Aplikasi dapat diakses di:** `https://your-domain.com`

---

**💡 Tips:**
- Gunakan domain yang mudah diingat
- Setup monitoring dengan Uptime Robot (gratis)
- Backup VPS secara berkala
- Monitor resource usage
- Update dependencies secara berkala