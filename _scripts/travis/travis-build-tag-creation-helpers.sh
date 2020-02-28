# strindex $a $b returns the index where $b can be first found in $a, or -1 if it can't be found
strindex() { 
  x="${1%%$2*}"
  [[ "$x" = "$1" ]] && echo -1 || echo "${#x}"
}

# Returns the JIRA ticket number found in the input string
createJiraTicketSubstring() {
  TICKET_START_INDEX=`strindex "$1" ABX | bc`

  let JIRA_TICKET_START=TICKET_START_INDEX+1
  echo "$1" | cut -c$JIRA_TICKET_START-8
}

# This function creates the TAG to be used when tagging the docker images
# The JIRA ticket number found in the commit message will be used as the TAG
# If no ticket number is found the commit hash will be used
function createDockerImageTag {
  TAG=$COMMIT_HASH

  if [[ "$COMMIT_MESSAGE" == *"ABX"* ]]; then
    TAG=`createJiraTicketSubstring "$COMMIT_MESSAGE"`
  fi

  echo $TAG
}
