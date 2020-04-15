./_scripts/travis/travis-build-branch-checkout.sh

export DOCKER_IMAGE_TAG=`echo "$TRAVIS_TAG" | sed -r 's/[\/_]+/-/g'`
echo $DOCKER_IMAGE_TAG

# Authenticating with ECR
eval $(aws ecr get-login --region ap-southeast-2 --no-include-email)

node ./_scripts/travis/build-image.util.js $1 \
&& lerna run push-image --scope $1 --since develop \
&& lerna run deploy-latest-integration --scope $1 --since develop
