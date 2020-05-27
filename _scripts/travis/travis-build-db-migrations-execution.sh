#!/bin/bash

./_scripts/travis/travis-build-branch-checkout.sh

npm link
npm run bootstrap

# Run legacy migrations to get DB in good shape for tests
lerna run build --scope @abx-utils/kbe-legacy-migrations --include-dependencies --exclude-dependents
npm run run-legacy-migrations:test 
