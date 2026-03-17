# Run this script to install the Cloudflare Tunnel Service
# sudo bash scripts/install-cloudflare-service.sh


#!/bin/bash
set -e

echo "🚀 Installing Cloudflare Tunnel Service..."
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run with sudo:"
    echo "   sudo bash scripts/install-cloudflare-service.sh"
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Stop the currently running container if it exists
echo "🛑 Stopping existing cloudflared container..."
docker stop cloudflared-tunnel 2>/dev/null || true
docker rm cloudflared-tunnel 2>/dev/null || true

# Copy service file
echo "📋 Installing systemd service..."
cp scripts/cloudflared-tunnel.service /etc/systemd/system/

# Reload systemd
echo "🔄 Reloading systemd..."
systemctl daemon-reload

# Enable and start service
echo "✅ Enabling service to start on boot..."
systemctl enable cloudflared-tunnel

echo "🚀 Starting service..."
systemctl start cloudflared-tunnel

# Wait a moment for it to start
sleep 3

# Show status
echo ""
echo "✅ Service installed successfully!"
echo ""
echo "📊 Current status:"
systemctl status cloudflared-tunnel --no-pager -l

echo ""
echo "📝 View logs with:"
echo "   sudo journalctl -u cloudflared-tunnel -f"
echo ""
echo "🔧 Manage service with:"
echo "   sudo systemctl status cloudflared-tunnel"
echo "   sudo systemctl restart cloudflared-tunnel"
echo "   sudo systemctl stop cloudflared-tunnel"
