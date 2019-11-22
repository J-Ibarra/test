# The git tag as published by lerna has the format {service}@{version} e.g. notifications@1.0.1
# So here we are doing a string split to get the service and version
echo export SERVICE="$(cut -d'@' -f1 <<<"$TRAVIS_TAG")"
echo export VERSION="$(cut -d'@' -f2 <<<"$TRAVIS_TAG")"
