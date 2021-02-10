 #!/bin/sh
 cp -r ../lib ./dev-in-prod-lib
 pushd dev-in-prod-lib
 tsc
 popd
 docker build -t example .
 rm -rf dev-in-prod-lib