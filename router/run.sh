#!/bin/sh
docker run -p 3005:80 -d router
#docker logs `cat /tmp/example_container` 