 #!/bin/sh
 cp -r ../lib ./dev-in-prod-lib
 pushd dev-in-prod-lib
 tsc
 popd
 cp -r ../typedApi .
 pushd typedApi 
 tsc
 popd
 docker build -t router .
 rm -rf dev-in-prod-lib