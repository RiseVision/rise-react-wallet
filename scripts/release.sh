#!/usr/bin/env bash

VERSION=$(node -p "require('./package.json').version")

yarn build
rm -f release.zip
mkdir -p releases
# place the web release archive in /releases with a proper version number
pushd build
zip -r ../releases/rise-wallet-web-$VERSION.zip *
popd
# create a CNAME file for a custom domain in gh-pages
printf "gh-wallet.rise.vision\n" > build/CNAME
