sudo apt install nginx
curl -sL https://deb.nodesource.com/setup_14.x -o nodesource_setup.sh
sudo bash nodesource_setup.sh
sudo apt-get install -y nodejs
sudo npm install --global yarn
sudo snap install core; sudo snap refresh core
sudo apt-get remove certbot
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
sudo rm /etc/nginx/sites-enabled/*
sudo ln -s /home/ubuntu/devinprod/devops/etc/nginx/sites-available/devinproddemo.com.conf /etc/nginx/sites-enabled
sudo ln -s /home/ubuntu/devinprod/devops/etc/nginx/sites-available/dsee.io.conf /etc/nginx/sites-enabled
sudo systemctl restart nginx.service
cd devinprod
yarn
cd router
yarn prisma db push --preview-feature
cd ..
NEXTAUTH_URL=https://dsee.io ./bin/run_router.sh
./bin/run_example.sh
