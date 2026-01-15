#!/bin/bash
# SSL Setup Script for Alpha Star Aviation Backend

# Install nginx and certbot
apt update
apt install -y nginx certbot python3-certbot-nginx

# Create nginx config
cat > /etc/nginx/sites-available/alphastar-api << 'EOF'
server {
    listen 80;
    server_name api.yourdomain.com;  # Replace with your domain

    location / {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable the site
ln -s /etc/nginx/sites-available/alphastar-api /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# Get SSL certificate (replace with your domain and email)
certbot --nginx -d api.yourdomain.com --non-interactive --agree-tos -m your-email@example.com

echo "SSL setup complete! Your API is now available at https://api.yourdomain.com"
