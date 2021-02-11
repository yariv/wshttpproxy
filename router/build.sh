 #!/bin/sh
 mkdir .docker_imports
 cp -r ../lib .docker_imports/dev-in-prod-lib
 pushd dev-in-prod-lib
 tsc
 popd
 cp -r ../typedApi .docker_imports/
 pushd typedApi 
 tsc
 popd
 docker build -t router .
 rm -rf dev-in-prod-lib