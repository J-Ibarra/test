./_scripts/travis/travis-build-branch-checkout.sh
./_scripts/travis/travis-build-test-execution.sh $1

JIRA_IMAGE_TAG="$TRAVIS_BRANCH-$TRAVIS_COMMIT"
echo $JIRA_IMAGE_TAG

# Invoking test followed by build-image-latest followed by push-image on each service package that has changed since previous commit
lerna run build  --since develop --include-dependencies \
&& lerna run test  --since develop --include-dependencies \
&& lerna run build-image-latest  --since develop \
&& lerna run push-image  --since develop
