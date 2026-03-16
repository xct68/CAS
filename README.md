# Simple CTF Platform

A basic Capture The Flag (CTF) platform for local network training.

## Features
- User registration and login.
- Admin panel (add/delete challenges).
- Basic preloaded challenges.
- Persistent storage using SQLite.

## Installation on Debian

1.  **Clone the repository or copy files to the server.**
2.  **Make the setup script executable:**
    ```bash
    chmod +x setup.sh
    ```
3.  **Run the setup script:**
    ```bash
    ./setup.sh
    ```

The script will:
- Install Node.js and required dependencies.
- Install the application to `/opt/ctf-platform`.
- Start the application using `pm2` on port 3000.
- Set up auto-start on boot.

## Network Access
The application listens on all interfaces (`0.0.0.0`) at port `3000`. 
Other machines on the same network can access it via the server's IP address:
`http://<SERVER_IP>:3000`

## Initial Admin
The first user to register with the username `admin` will be granted admin privileges.
Admin can add new challenges and view existing ones (including flags).
