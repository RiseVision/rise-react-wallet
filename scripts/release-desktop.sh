#!/usr/bin/env bash

VERSION=$(node -p "require('./package.json').version")

mkdir -p releases
pushd desktop
yarn install
yarn release
# pack binaries
pushd dist
tar -czvf rise-wallet-desktop-linux.tar.gz rise-wallet-desktop-linux
tar -czvf rise-wallet-desktop-macos.tar.gz rise-wallet-desktop-macos
zip rise-wallet-desktop-win.zip rise-wallet-desktop-win.exe
popd
# copy the binaries to `/build` which will be deployed to gh-pages
# as nightly builds
cp dist/rise-wallet-desktop-win.zip \
	../dist/rise-wallet-win-nightly.zip
cp dist/rise-wallet-desktop-linux.tar.gz \
	../dist/rise-wallet-linux-nightly.tar.gz
cp dist/rise-wallet-desktop-macos.tar.gz \
	../dist/rise-wallet-macos-nightly.tar.gz
# rename the binaries with the correct version number
# in case of a tag-based release deployment
mv dist/rise-wallet-desktop-win.zip \
	../releases/rise-wallet-win-$VERSION.zip
mv dist/rise-wallet-desktop-linux.tar.gz \
	../releases/rise-wallet-linux-$VERSION.tar.gz
mv dist/rise-wallet-desktop-macos.tar.gz \
	../releases/rise-wallet-macos-$VERSION.tar.gz
