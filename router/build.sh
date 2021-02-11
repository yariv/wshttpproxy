 #!/bin/sh
 mkdir .docker_imports 2>/dev/null
 cp -r ../lib .docker_imports/dev-in-prod-lib
 pushd .docker_imports/dev-in-prod-lib
 tsc
 popd
 cp -r ../typedApi .docker_imports/
 pushd .docker_imports/typedApi 
 tsc
 popd
 docker build -t router .
 #rm -rf .docker_imports