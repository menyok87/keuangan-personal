#!/bin/bash

# Deploy Script for Akuntansi Keuangan App
# Usage: ./deploy.sh

set -e

echo "🚀 Starting deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="akuntansi-keuangan"
APP_DIR="/var/www/$APP_NAME"
NGINX_SITE="/etc/nginx/sites-available/$APP_NAME"
BACKUP_DIR="/var/backups/$APP_NAME"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   log_error "This script should not be run as root"
   exit 1
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    log_error "PM2 is not installed. Please install PM2 first:"
    echo "sudo npm install -g pm2"
    exit 1
fi

# Check if app directory exists
if [ ! -d "$APP_DIR" ]; then
    log_error "App directory $APP_DIR does not exist"
    exit 1
fi

# Create backup directory
sudo mkdir -p $BACKUP_DIR

# Backup current version
log_info "Creating backup..."
BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
sudo cp -r $APP_DIR $BACKUP_DIR/$BACKUP_NAME
log_success "Backup created: $BACKUP_DIR/$BACKUP_NAME"

# Navigate to app directory
cd $APP_DIR

# Pull latest changes
log_info "Pulling latest changes from repository..."
git fetch origin
git reset --hard origin/main
log_success "Code updated"

# Install/update dependencies
log_info "Installing dependencies..."
npm ci --production=false
log_success "Dependencies installed"

# Build application
log_info "Building application..."
npm run build:production
log_success "Application built"

# Restart application with PM2
log_info "Restarting application..."
pm2 restart $APP_NAME
log_success "Application restarted"

# Wait for app to start
log_info "Waiting for application to start..."
sleep 5

# Check if app is running
if pm2 list | grep -q "$APP_NAME.*online"; then
    log_success "Application is running"
else
    log_error "Application failed to start"
    log_info "Checking logs..."
    pm2 logs $APP_NAME --lines 20
    exit 1
fi

# Test application health
log_info "Testing application health..."
if curl -f -s http://localhost:3000 > /dev/null; then
    log_success "Application is responding"
else
    log_warning "Application health check failed"
fi

# Reload Nginx (if needed)
if sudo nginx -t 2>/dev/null; then
    log_info "Reloading Nginx..."
    sudo systemctl reload nginx
    log_success "Nginx reloaded"
else
    log_warning "Nginx configuration test failed"
fi

# Clean up old backups (keep last 5)
log_info "Cleaning up old backups..."
cd $BACKUP_DIR
sudo ls -t | tail -n +6 | sudo xargs -r rm -rf
log_success "Old backups cleaned up"

# Show deployment summary
echo ""
log_success "🎉 Deployment completed successfully!"
echo ""
echo "📊 Application Status:"
pm2 list | grep $APP_NAME
echo ""
echo "📝 Recent Logs:"
pm2 logs $APP_NAME --lines 5 --nostream
echo ""
echo "🌐 Application should be available at your domain"
echo "📁 Backup created at: $BACKUP_DIR/$BACKUP_NAME"
echo ""

# Optional: Send notification (uncomment if needed)
# curl -X POST -H 'Content-type: application/json' \
#     --data '{"text":"🚀 Akuntansi Keuangan deployed successfully!"}' \
#     YOUR_SLACK_WEBHOOK_URL