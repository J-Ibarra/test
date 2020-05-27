./_scripts/travis/travis-build-branch-checkout.sh
./_scripts/travis/travis-build-db-migrations-execution.sh $1

# Invoking test followed by build-image-latest followed by push-image on each service package that has changed since previous commit
lerna run build --stream --scope $1 --since develop --include-dependencies \
&& lerna run run-migrations:test --stream --since develop --include-dependencies \
&& ./_scripts/travis/travis-build-test-execution.sh $1
