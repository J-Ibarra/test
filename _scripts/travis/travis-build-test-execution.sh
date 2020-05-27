# Removing left and right curly brackets from input, example input: {@abx/exchange-deposit-service,@abx/exchange-reference-data-service}'
scopeWithLeftBracketRemoved=${1/{/}
scopeWithLeftAndRightBracketsRemoved=${scopeWithLeftBracketRemoved/\}/}

# Splitting services on ',' delimiter
servicePackages=(${scopeWithLeftAndRightBracketsRemoved//,/ })

# Running tests for each service in sequence, Max 3 services supported
if [[ "${servicePackages[2]}" != "" ]]; then
  lerna run test --scope ${servicePackages[0]} --since develop --include-dependencies \
  && lerna run test --scope ${servicePackages[1]} --since develop --include-dependencies \
  && lerna run test --scope ${servicePackages[2]} --since develop --include-dependencies
else
  lerna run test --scope ${servicePackages[0]} --since develop --include-dependencies \
  && lerna run test --scope ${servicePackages[1]} --since develop --include-dependencies
fi
