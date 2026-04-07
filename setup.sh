#!/bin/bash

# Update and install dependencies
sudo apt-get update
sudo apt-get install -y curl build-essential

# Install Node.js (current LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Create app directory
APP_DIR="/opt/ctf-platform"
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR

# Copy files (assuming running from the repo root)
cp -r . $APP_DIR
cd $APP_DIR

# Install npm packages
npm install

# Configure firewall if UFW is enabled
if command -v ufw &> /dev/null; then
    echo "Configuring firewall to allow port 3000..."
    sudo ufw allow 3000/tcp
fi

# Start the application using pm2 to keep it running
sudo npm install -g pm2
pm2 start index.js --name ctf-platform
pm2 save
sudo pm2 startup

# Get the server IP address
SERVER_IP=$(hostname -I | awk '{print $1}')

echo ""
echo "======================================================="
echo "✓ CTF Platform has been installed and started."
echo "======================================================="
echo "Access it from this machine at:"
echo "  http://localhost:3000"
echo ""
echo "Access it from another machine at:"
echo "  http://${SERVER_IP}:3000"
echo ""
echo "Setup Instructions:"
echo "  1. Register with username 'admin' to get admin privileges"
echo "  2. If you can't connect from another machine, check:"
echo "     - Firewall is allowing port 3000: sudo ufw status"
echo "     - Server is running: pm2 status"
echo "     - Network connectivity: ping ${SERVER_IP}"
echo "======================================================="
echo ""

