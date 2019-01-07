## RISE Wallet

[![Build Status](https://travis-ci.org/RiseVision/rise-react-wallet.svg?branch=master)](https://travis-ci.org/RiseVision/rise-react-wallet)
[![Crowdin](https://d322cqt584bo4o.cloudfront.net/rise-web-wallet/localized.svg)](https://crowdin.com/project/rise-web-wallet)

RISE Wallet - web & desktop wallet for the **RISE** DPoS blockchain. Build using **TypeScript**, **React** and **Material UI**.

### URLs

- [mainnet](https://wallet-beta.rise.vision/)
- [testnet](https://twallet-beta.rise.vision/)

### Status

- [x] Onboarding
- [x] Account page
- [x] Settings
- [x] Sending Coins
- [x] Address book
- [x] Ledger hardware wallet support
- [x] Unit tests
- [x] End-to-end tests

### Contributing

Running:
1. Clone the repo
1. Run `yarn start`

Building:
1. Clone the repo
1. Run `yarn build`

### Custom backend

To get the wallet working with a custom RISE deployment by default, you need to:
1. Checkout a working copy
1. Edit `src/config.json` and change both `api_url` and `api_url_testnet`
1. Build a release with `yarn build` or `yarn run release`


### About RISE

RISE is a next generation crypto-currency and blockchain application platform, written entirely in TypeScript. For more information please refer to [our website](https://rise.vision/).
