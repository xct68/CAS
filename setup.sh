#!/bin/bash

set -e  # Exit on error

echo "======================================================="
echo "CTF Platform Setup Script"
echo "======================================================="
echo ""

# Update and install dependencies
echo "Installing system dependencies..."
sudo apt-get update
sudo apt-get install -y curl build-essential python3 git

# Install Node.js (current LTS)
echo "Installing Node.js v20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify Node.js installation
echo "Verifying Node.js installation..."
node --version
npm --version

# Create app directory
APP_DIR="/opt/ctf-platform"
echo "Creating application directory at $APP_DIR..."
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR

# Copy files (assuming running from the repo root)
echo "Copying application files..."
cp -r . $APP_DIR
cd $APP_DIR

# Install npm packages
echo "Installing npm dependencies..."
npm install

# Rebuild native modules for this architecture
echo "Rebuilding native modules for server architecture..."
npm rebuild better-sqlite3 || {
    echo "Failed to rebuild better-sqlite3. Installing build dependencies..."
    sudo apt-get install -y build-essential python3
    npm rebuild better-sqlite3
}

# Install PM2 globally
echo "Installing PM2..."
sudo npm install -g pm2

# Configure firewall if UFW is enabled
if command -v ufw &> /dev/null; then
    echo "Configuring firewall to allow port 3000..."
    sudo ufw allow 3000/tcp
    echo "✓ Firewall configured"
else
    echo "⚠ UFW not detected. If using a firewall, manually allow port 3000"
fi

# Create PM2 ecosystem config file for proper working directory
echo "Creating PM2 configuration file..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'ctf-platform',
    script: './index.js',
    cwd: '/opt/ctf-platform',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '500M',
    error_file: '/opt/ctf-platform/logs/error.log',
    out_file: '/opt/ctf-platform/logs/out.log',
    log_file: '/opt/ctf-platform/logs/combined.log'
  }]
};
EOF

# Create logs directory
mkdir -p /opt/ctf-platform/logs

# Start the application using pm2
echo "Starting application with PM2..."
pm2 start ecosystem.config.js
pm2 save
sudo pm2 startup -u $USER --hp /home/$USER

# Verify the app started successfully
sleep 2
echo "Verifying application status..."
pm2 status

# Get the server IP address
SERVER_IP=$(hostname -I | awk '{print $1}')

echo ""
echo "======================================================="
echo "✓ CTF Platform has been installed and started."
echo "======================================================="
echo ""
echo "Access it from this machine at:"
echo "  http://localhost:3000"
echo ""
echo "Access it from another machine at:"
echo "  http://${SERVER_IP}:3000"
echo ""
echo "Setup Instructions:"
echo "  1. Register with username 'admin' to get admin privileges"
echo "  2. Monitor the application:"
echo "     pm2 status"
echo "     pm2 logs ctf-platform"
echo ""
echo "Troubleshooting:"
echo "  - Check firewall: sudo ufw status"
echo "  - Check connectivity: ping ${SERVER_IP}"
echo "  - View logs: pm2 logs ctf-platform --lines 50"
echo "  - Restart app: pm2 restart ctf-platform"
echo "  - Stop app: pm2 stop ctf-platform"
echo ""
echo "======================================================="
echo ""

