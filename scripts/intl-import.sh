#!/bin/bash

archive=$1
if [ ! -f "$archive" ]; then
  echo "Usage: $0 <zip file>"
  exit 1
fi

# Generate locale "template" file
template="tmp/messages-template.json"
jq -s 'reduce .[][] as $i ({};
  .[$i.id] = "\($i.defaultMessage) | \($i.description)"
)' $(find tmp/messages/ -iname "*.json") > $template

# Find translated data files from the zip file
unzip -Z1 $archive messages/*.json | while read -r path; do
  file=$(basename -- "$path")
  country=${file%.*}
  translations="tmp/messages.$country.json"
  output="src/translations/locales/$country.json"

  echo "Importing $path to $output"

  # Generate the react-intl locale file
  unzip -p $archive $path > $translations
  jq --slurpfile msg $translations 'with_entries(
    select(.value | in($msg[0]))
    | .value = $msg[0][.value].message
  )' $template > $output
done
