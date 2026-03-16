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

# Start the application using pm2 to keep it running
sudo npm install -g pm2
pm2 start index.js --name ctf-platform
pm2 save
sudo pm2 startup

echo "-------------------------------------------------------"
echo "CTF Platform has been installed and started."
echo "Access it at http://$(hostname -I | awk '{print $1}'):3000"
echo "Register with username 'admin' to get admin privileges."
echo "-------------------------------------------------------"
