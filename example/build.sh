 #!/bin/sh
 mkdir .docker_imports
 cp -r ../lib ./.docker_imports/dev-in-prod-lib
 pushd dev-in-prod-lib
 tsc
 popd
 docker build -t example .
 rm -rf dev-in-prod-lib