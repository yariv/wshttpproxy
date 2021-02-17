server {
    listen 80;
    listen [::]:80;
    server_name dsee.io;

    # Redirect non-https traffic to https
    if ($scheme != "https") {
        return 301 https://$host$request_uri;
    } # managed by Certbot
}

server {
    listen 443 ssl; # managed by Certbot

    location / {
      proxy_pass http://localhost:3001;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header Host $host;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    server_name dsee.io;


    # RSA certificate
    ssl_certificate /etc/letsencrypt/live/dsee.io/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/dsee.io/privkey.pem; # managed by Certbot

    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
}
