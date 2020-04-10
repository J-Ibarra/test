export JIRA_IMAGE_TAG=`echo "$TRAVIS_BRANCH-$TRAVIS_COMMIT" | sed -r 's/[\/_]+/-/g'`
echo $JIRA_IMAGE_TAG

# Authenticating with ECR
eval $(aws ecr get-login --region ap-southeast-2 --no-include-email)

node ./_scripts/travis/build-image.util.js $1 && lerna run push-image --scope $1 --since develop
