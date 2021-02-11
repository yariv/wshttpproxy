 #!/bin/sh
 mkdir .docker_imports 2>/dev/null
 cp -r ../lib .docker_imports/dev-in-prod-lib
 pushd .docker_imports/dev-in-prod-lib
 tsc
 popd
 docker build -t example .
 rm -rf .docker_imports