source ./_scripts/travis/travis-build-tag-creation-helpers.sh 

# Authenticating with ECR
eval $(aws ecr get-login --region ap-southeast-2 --no-include-email)

# Invoking createImageTag from travis-build-tag-creation-helpers.sh, exporting the result to used for the Docker images
export JIRA_IMAGE_TAG=`createDockerImageTag`

echo $JIRA_IMAGE_TAG

# Getting the previouscommit
PREVIOUS_COMMIT_HASH=$(git rev-parse @~)

echo $PREVIOUS_COMMIT_HASH 

# Invoking build-image-latest script on each service package that has changed since previous commit
lerna run build-image-latest --since $PREVIOUS_COMMIT_HASH

# Invoking push-image script on each service package that has changed since previous commit
lerna run push-image --since $PREVIOUS_COMMIT_HASH

# Invoking deploy-latest-integration script on each service package that has changed since previous commit
lerna run deploy-latest-integration --since $PREVIOUS_COMMIT_HASH
