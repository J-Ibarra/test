#!/bin/bash

###
### Copying all local ENV variables into the container
###
for f in /run/secrets/*;do
  secret_contents=$(cat $f)
  environment_val=${secret_contents/\!\!\!literal_empty_string\!\!\!/}
  environment_key=$(basename $f)
  declare -x "$environment_key=$environment_val"
done

ts-node-dev bootstrap.ts
