# !!!
# !!! THIS WILL BE DEPRECATED AFTER BTC RELEASE
# !!!
source ./_scripts/travis/travis-build-tag-creation-helpers.sh 

# Authenticating with ECR
eval $(aws ecr get-login --region ap-southeast-2 --no-include-email)

# Invoking createImageTag from travis-build-tag-creation-helpers.sh, exporting the result to used for the Docker images
export JIRA_IMAGE_TAG=`createDockerImageTag`

if [[ "$TRAVIS_BRANCH" == *"feature"* ]]; then
  JIRA_IMAGE_TAG=`echo "$TRAVIS_BRANCH" | sed -r 's/[\/_]+/-/g'`
fi

echo $JIRA_IMAGE_TAG

# Getting the previouscommit
PREVIOUS_COMMIT_HASH=$(git rev-parse @~)

echo $PREVIOUS_COMMIT_HASH 

# Invoking build-image-latest script on each service package that has changed since previous commit
lerna run build-image-latest --scope $1 --since $PREVIOUS_COMMIT_HASH \
&& lerna run push-image --scope $1 --since $PREVIOUS_COMMIT_HASH \
&& lerna run deploy-latest-integration --scope $1 --since $PREVIOUS_COMMIT_HASH
