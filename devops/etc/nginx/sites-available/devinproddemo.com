server {
    listen 80;
    listen [::]:80;
    root /var/www/html;
    server_name *.devinproddemo.com;

    # Redirect non-https traffic to https
    if ($scheme != "https") {
        return 301 https://$host$request_uri;
    } # managed by Certbot
}

server {
    listen 443 ssl; # managed by Certbot

    root /var/www/html;
    server_name www.devinproddemo.com;

    location / {
      proxy_pass http://localhost:3002;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header Host $host;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # RSA certificate
    ssl_certificate /etc/letsencrypt/live/devinproddemo.com-0002/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/devinproddemo.com-0002/privkey.pem; # managed by Certbot

    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
}

server {
    listen 443 ssl; # managed by Certbot

    root /var/www/html;

    server_name ~^www-rk.+\.devinproddemo\.com$;

    location / {
      proxy_pass https://dsee.io;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header Host $host;
      proxy_set_header X-Forwarded-Host $proxy_add_x_forwarded_for;
      proxy_set_header dev-in-prod-app-secret: asdf;
    }

    # RSA certificate
    ssl_certificate /etc/letsencrypt/live/devinproddemo.com-0002/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/devinproddemo.com-0002/privkey.pem; # managed by Certbot

    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
}

