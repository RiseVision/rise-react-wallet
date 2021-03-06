#!/bin/bash

archive=$1
if [ ! -f "$archive" ]; then
  echo "Usage: $0 <zip file>"
  exit 1
fi

# Generate locale "template" file
template="tmp/intl/messages-template.json"
jq -s 'reduce .[][] as $i ({};
  .[$i.id] = "\($i.defaultMessage) | \($i.description)"
)' $(find tmp/intl/messages/ -iname "*.json") > $template

# Find translated data files from the zip file
unzip -Z1 $archive messages/*.json | while read -r path; do
  file=$(basename -- "$path")
  country=${file%.*}
  translations="tmp/intl/messages.$country.json"
  output="src/translations/locales/$country.json"

  echo "Importing $path to $output"

  # Generate the react-intl locale file
  unzip -p $archive $path > $translations
  jq --slurpfile tmpl $template '
    (if type != "object" then {} else . end) as $msg
    | $tmpl[0] | with_entries(
      select(.value | in($msg))
      | .value = $msg[.value].message
    )
  ' $translations > $output
done
