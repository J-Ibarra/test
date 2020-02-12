# Authenticating with ECR
eval $(aws ecr get-login --region ap-southeast-2 --no-include-email)

# Getting the previouscommit
PREVIOUS_COMMIT_HASH=$(git rev-parse @~)

echo $PREVIOUS_COMMIT_HASH 

# Invoking build-image-latest script on each service package that has changed since previous commit
lerna run build-image-latest --since $PREVIOUS_COMMIT_HASH

# Invoking push-image script on each service package that has changed since previous commit
lerna run push-image --since $PREVIOUS_COMMIT_HASH
