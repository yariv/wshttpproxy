rsync -av — progress -e "ssh -i ~/devinprod.pem" . --exclude-from=".gitignore" --exclude=".git" ubuntu@18.233.39.243:~/devinprod