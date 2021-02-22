 #!/bin/sh
 docker build -t dsee -f Dockerfile.lambda.example .
 docker tag dsee:latest 159740044410.dkr.ecr.us-east-1.amazonaws.com/dsee:latest
 docker push 159740044410.dkr.ecr.us-east-1.amazonaws.com/dsee:latest
 