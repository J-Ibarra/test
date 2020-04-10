./_scripts/travis/travis-build-branch-checkout.sh
./_scripts/travis/travis-build-test-execution.sh $1

export JIRA_IMAGE_TAG=`echo "$TRAVIS_BRANCH-$TRAVIS_COMMIT" | sed -r 's/[\/_]+/-/g'`
echo $JIRA_IMAGE_TAG

# Authenticating with ECR
eval $(aws ecr get-login --region ap-southeast-2 --no-include-email)

# Invoking test followed by build-image-latest followed by push-image on each service package that has changed since previous commit
lerna run build --scope $1 --since develop --include-dependencies \
&& lerna run run-migrations:test --since develop --include-dependencies \
&& lerna run test --scope $1 --since develop --include-dependencies \
&& node ./_scripts/travis/build-image.util.js $1 \
&& lerna run push-image --scope $1 --since develop
