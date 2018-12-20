#!/bin/bash

# Make sure that there no duplicate/conflicting IDs
dups=$(jq -sr '[.[][]]
  | group_by(.id)
  | map({
    id: .[0].id,
    messages: [.[] | .defaultMessage]
  })
  | map(select(.messages | length > 1))
  | map("  - \(.id)")
  | join("\n")
' $(find tmp/intl/messages/ -iname "*.json"))
if [ ! -z "$dups" ]; then
  echo "Error: Found duplicate IDs"
  echo "$dups"
  exit 1;
fi

# Generate the messages file to be translated
output="tmp/intl/messages.json"
jq -s 'reduce .[][] as $i ({};
  "\($i.defaultMessage) | \($i.description)" as $id
  | .[$id] = {
    message: $i.defaultMessage,
    description: $i.description
  }
)' $(find tmp/intl/messages/ -iname "*.json") > $output
