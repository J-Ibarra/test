./_scripts/travis/travis-build-branch-checkout.sh
./_scripts/travis/travis-build-test-execution.sh $1

JIRA_IMAGE_TAG="$TRAVIS_BRANCH-$TRAVIS_COMMIT"
echo $JIRA_IMAGE_TAG

# Authenticating with ECR
eval $(aws ecr get-login --region ap-southeast-2 --no-include-email)

# Invoking test followed by build-image-latest followed by push-image on each service package that has changed since previous commit
lerna run build --scope $1 --since develop --include-dependencies \
&& lerna run run-migrations:test --since develop --include-dependencies \
&& lerna run test --scope $1 --since develop --include-dependencies
