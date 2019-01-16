#!/usr/bin/env bash

VERSION=$(node -p "require('./package.json').version")

mkdir -p releases
pushd desktop
yarn install
yarn release
# copy the binaries to `/build` which will be deployed to gh-pages
# as nightly builds
cp dist/rise-wallet-desktop-win.exe ../build/rise-wallet-win-nightly.exe
cp dist/rise-wallet-desktop-linux ../build/rise-wallet-linux-nightly
cp dist/rise-wallet-desktop-macos ../build/rise-wallet-macos-nightly
# rename the binaries with the correct version number
# in case of a tag-based release deployment
mv dist/rise-wallet-desktop-win.exe ../releases/rise-wallet-win-$VERSION.exe
mv dist/rise-wallet-desktop-linux ../releases/rise-wallet-linux-$VERSION
mv dist/rise-wallet-desktop-macos ../releases/rise-wallet-macos-$VERSION
