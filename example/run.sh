#!/bin/sh
docker run -p 3001:80 -d example
#docker logs `cat /tmp/example_container` 