#!/usr/bin/env bash

echo $(pwd)
VERSION=$(node -p "require('./package.json').version")

yarn build
rm -f release.zip
mkdir -p releases
# place the web release archive in /releases with a proper version number
pushd build
zip -r ../releases/rise-wallet-web-$VERSION.zip *
popd
# put CNAME file for a custom domain for nightly in gh-pages
echo "gh-wallet.rise.vision\n" > build/CNAME
