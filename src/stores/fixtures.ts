// tslint:disable:max-line-length
import assert from 'assert';
import { TConfig } from './index';

/** Account from localStorage. Need to match the data in `serverAccounts`. */
export const storedAccounts = [
  {
    id: '2655711995542512317R',
    localId: 1,
    publicKey:
      '023bab3e17365565d7a796291f8d3bb6878a3083ea520fbd163db713d51b44f9',
    type: 1,
    hwId: null,
    hwSlot: null,
    fiatCurrency: 'USD',
    name: '',
    pinned: true
  },
  {
    id: '5932278668828702947R',
    localId: 2,
    publicKey:
      '491e09b538aa8d44a613bc5d23e2b6a4f93126b89c8fb8766016708af519fded',
    type: 1,
    hwId: null,
    hwSlot: null,
    fiatCurrency: 'USD',
    name: 'test-2',
    pinned: false
  },
  {
    id: '11543739950532038814R',
    localId: 3,
    publicKey:
      '63a12d153b3c72ed71392da9aac6b897c4b908f9ff17201794d69b4622d30aee',
    type: 1,
    hwId: null,
    hwSlot: null,
    fiatCurrency: 'USD',
    name: '',
    pinned: false
  },
  {
    id: '10317456780953445784R',
    localId: 4,
    publicKey:
      'e9ae239743b47125305a3f339937661368a7f8d810ae53d79e5c4de001356563',
    type: 1,
    hwId: null,
    hwSlot: null,
    fiatCurrency: 'USD',
    name: 'test-3',
    pinned: false
  }
];

/** Account from localStorage. Need to match the data in `storedAccounts`. */
export const serverAccounts = [
  {
    success: true,
    account: {
      address: '2655711995542512317R',
      balance: '37499999998',
      multisignatures: [],
      publicKey:
        '023bab3e17365565d7a796291f8d3bb6878a3083ea520fbd163db713d51b44f9',
      secondPublicKey:
        '0b1a358e0a0c5aa2f5fd368246fcd49311a4aeca78df5bd00ce30c1821acf700',
      secondSignature: 1,
      u_multisignatures: [],
      unconfirmedBalance: '37499999998',
      unconfirmedSignature: 1
    }
  },
  {
    success: true,
    account: {
      address: '5932278668828702947R',
      balance: '180000000',
      multisignatures: [],
      publicKey:
        '491e09b538aa8d44a613bc5d23e2b6a4f93126b89c8fb8766016708af519fded',
      secondPublicKey:
        '67d3b5eaf0c0bf6b5a602d359daecc86a7a74053490ec37ae08e71360587c870',
      secondSignature: 1,
      u_multisignatures: [],
      unconfirmedBalance: '180000000',
      unconfirmedSignature: 1
    }
  },
  { success: false, error: 'Account not found' },
  {
    success: true,
    account: {
      address: '10317456780953445784R',
      balance: '24388000000',
      multisignatures: [],
      publicKey:
        'e9ae239743b47125305a3f339937661368a7f8d810ae53d79e5c4de001356563',
      secondPublicKey:
        '34d26579dbb456693e540672cf922f52dde0d6532e35bf06be013a7c532f20e0',
      secondSignature: 1,
      u_multisignatures: [],
      unconfirmedBalance: '24388000000',
      unconfirmedSignature: 1
    }
  }
];

assert(
  serverAccounts.length === storedAccounts.length,
  'Stored and server accounts should match'
);

export const storedContacts = [
  { id: '10317456780953445784R', name: 'test' },
  { id: '12525095472804841547R', name: 'DE AD' },
  { id: '11543739950532038814R', name: 'hidden contact name' },
  { id: '5399275477602875017R', name: 'test fixture 2' }
];

export const serverTransactionsUnconfirmed = {
  success: true,
  count: 1,
  transactions: [
    // not an actual transaction (user-generated)
    {
      signatures: [],
      id: '12628099815516138546',
      rowId: 17487,
      height: 967703,
      blockId: '8968901776605570983',
      type: 0,
      timestamp: 73261827,
      senderPubData:
        '491e09b538aa8d44a613bc5d23e2b6a4f93126b89c8fb8766016708af519fded',
      senderId: '5932278668828702947R',
      recipientId: '5399275477602875017R',
      amount: 5800000000,
      fee: 10000000,
      signature:
        '3f3d779403141553a2f637b553d74176be65dd4ce4d768d6f1326d372c660bc62a7fea10865051664313897706ae5b4f3c29ba37ea713ebea137ee7733c97204',
      signSignature:
        'd30272def093b05b6ea74a3de6e2d91c5cb66b9fad43597a5b0e5b42305fb71cfed52d295ca417256e42fec464fc0fa1ae972a28f07ef4cb0af051d748b28c04',
      requesterPublicKey: null,
      asset: null,
      confirmations: 80124
    }
  ]
};

export const serverTransactionsConfirmed = {
  success: true,
  count: 5,
  transactions: [
    {
      signatures: [],
      id: '6148269007073020449',
      rowId: 18165,
      height: 1064690,
      blockId: '12571019205669775789',
      type: 3,
      timestamp: 76189352,
      senderPubData:
        '023bab3e17365565d7a796291f8d3bb6878a3083ea520fbd163db713d51b44f9',
      senderId: '5932278668828702947R',
      recipientId: '5932278668828702947R',
      amount: 0,
      fee: 100000000,
      signature:
        'cac9d17a9e4d0ed55417f0d0f90deadbae5ab91d1745d0b97d20f91ed86a1a41aac378368ca84654cba651afee570e4b42709a69aafebb07ac77dc6b6bb33206',
      signSignature:
        'ed0f4235687b85688bb6cd9a6fcac75a0f4230363481e4b25a4fc9d825d1faa8d2f178d2778bde2e079185a56bb2fdd5c77a964b2c6ebfc8c463d4c1f75f3c07',
      requesterPublicKey: null,
      asset: {
        votes: [
          '+76fe4c7c944bde63bcc83e7af712b60f935c52bafe396f0d8195a885f35067ef'
        ]
      },
      confirmations: 44
    },
    {
      signatures: [],
      id: '12628099815516138545',
      rowId: 17487,
      height: 967703,
      blockId: '8968901776605570982',
      type: 0,
      timestamp: 73261826,
      senderPubData:
        '491e09b538aa8d44a613bc5d23e2b6a4f93126b89c8fb8766016708af519fded',
      senderId: '5932278668828702947R',
      recipientId: '5399275477602875017R',
      amount: 5800000000,
      fee: 10000000,
      signature:
        '3f3d779403141553a2f637b553d74176be65dd4ce4d768d6f1326d372c660bc62a7fea10865051664313897706ae5b4f3c29ba37ea713ebea137ee7733c97204',
      signSignature:
        'd30272def093b05b6ea74a3de6e2d91c5cb66b9fad43597a5b0e5b42305fb71cfed52d295ca417256e42fec464fc0fa1ae972a28f07ef4cb0af051d748b28c04',
      requesterPublicKey: null,
      asset: null,
      confirmations: 80124
    },
    {
      signatures: [],
      id: '7415144897891124057',
      rowId: 17486,
      height: 967685,
      blockId: '15315325139361767746',
      type: 1,
      timestamp: 73261262,
      senderPubData:
        '491e09b538aa8d44a613bc5d23e2b6a4f93126b89c8fb8766016708af519fded',
      senderId: '5932278668828702947R',
      recipientId: null,
      amount: 0,
      fee: 500000000,
      signature:
        'a5f008e67bdcc25c3c101342fab93f2b215bbe9d674c26c663bc55e602c2ec71b9bc0b3941630373c6b7d020ed769c1f334a7c888eb68f365f2b59478ba2320c',
      signSignature: null,
      requesterPublicKey: null,
      asset: {
        signature: {
          publicKey:
            '67d3b5eaf0c0bf6b5a602d359daecc86a7a74053490ec37ae08e71360587c870'
        }
      },
      confirmations: 80142
    },
    {
      signatures: [],
      id: '15782067148308559666',
      rowId: 17485,
      height: 967684,
      blockId: '2652299302775213052',
      type: 0,
      timestamp: 73261232,
      senderPubData:
        '491e09b538aa8d44a613bc5d23e2b6a4f93126b89c8fb8766016708af519fded',
      senderId: '5932278668828702947R',
      recipientId: '2655711995542512317R',
      amount: 8000000000,
      fee: 10000000,
      signature:
        'ec6773e16944d49f8ba5fb6c9a05f017248b38459237512017d9d88f3e3fba893a676380134b05c6d85e8d76b5a510d759dd3767ac938d6e622eb85490271609',
      signSignature: null,
      requesterPublicKey: null,
      asset: null,
      confirmations: 80143
    },
    {
      signatures: [],
      id: '4237658620247007635',
      rowId: 17484,
      height: 967641,
      blockId: '1577621231331325441',
      type: 0,
      timestamp: 73260039,
      senderPubData:
        '1db1a4d79853b86f438ad647743775788ed3f4f75ff698ecb2155e711e1137fe',
      senderId: '4221970229545791184R',
      recipientId: '5932278668828702947R',
      amount: 14500000000,
      fee: 10000000,
      signature:
        '324626568b89480a7b127eb0cc249090b3fd96f1b250ff62c92ef65632d30b6196b70dd787838c07d04b988eeb0b0dc1bb8e9c3d5cde29ec8b489fbea0af9706',
      signSignature:
        '5745d80cde7543351c83b3800d909b9b46f6f4032c75afe80796524e5412aa69828953ed12f7fbbda34e2556cbd54726b9998ea73636afd1e2a267c3e466670f',
      requesterPublicKey: null,
      asset: null,
      confirmations: 80186
    }
  ]
};

// TODO add `infos`
export const serverDelegatesSearch = {
  success: true,
  delegates: [
    {
      rank: 103,
      username: 'briccobau_test2',
      address: '2788895762866373979R',
      publicKey:
        '599f684b403974fce070a6ba368b64c144dbea9ba4715ab7dccec7804dd4db9b',
      vote: 4159473626501,
      producedblocks: 432,
      missedblocks: 6383,
      approval: 0.04,
      productivity: 6.34,
      voters_cnt: 5,
      register_timestamp: 33611060
    },
    {
      rank: 59,
      username: 'ccplatytestnet',
      address: '2278172406137525143R',
      publicKey:
        'a4489957a6631a9065fd8fbc9ab02089fdabbe66a79b55c465389d02494db2c5',
      vote: 110329740406173,
      producedblocks: 2626,
      missedblocks: 3,
      approval: 1.1,
      productivity: 99.89,
      voters_cnt: 2,
      register_timestamp: 68432657
    },
    {
      rank: 107,
      username: 'iloverise_test',
      address: '16136231386483916205R',
      publicKey:
        'd994e94540773de548f22dbd06ee00462897698f7b41d3255b9c7dff98705f5b',
      vote: 856711782110,
      producedblocks: 5653,
      missedblocks: 33,
      approval: 0.01,
      productivity: 99.42,
      voters_cnt: 1,
      register_timestamp: 33265925
    },
    {
      rank: 1,
      username: 'ololo_test',
      address: '1103307164606891969R',
      publicKey:
        'a4413ebd8ea3e2fd58453ae61f46b0a5498e37e33210d95426be8066ac2f203a',
      vote: 111432403079167,
      producedblocks: 8632,
      missedblocks: 19,
      approval: 1.11,
      productivity: 99.78,
      voters_cnt: 3,
      register_timestamp: 51463621
    },
    {
      rank: 163,
      username: 'seatripstestnet',
      address: '10958026515759283096R',
      publicKey:
        '62d87e6951ad773b7e50ce7e9e174be6eaf97f6d22e3751d0eb0f2296595ca2f',
      vote: 0,
      producedblocks: 665,
      missedblocks: 1371,
      approval: 0,
      productivity: 32.66,
      voters_cnt: 0,
      register_timestamp: 32677221
    },
    {
      rank: 189,
      username: 'testdelegate',
      address: '16456130399597425493R',
      publicKey:
        'b4c7ffa18a8281c03e4caea5650e595a7a3d6a7a6f619431192dec7d6db93147',
      vote: 0,
      producedblocks: 0,
      missedblocks: 0,
      approval: 0,
      productivity: 0,
      voters_cnt: 0,
      register_timestamp: 44218196
    },
    {
      rank: 136,
      username: 'testdelegate3242432',
      address: '2655711995542512317R',
      publicKey:
        '023bab3e17365565d7a796291f8d3bb6878a3083ea520fbd163db713d51b44f9',
      vote: 0,
      producedblocks: 0,
      missedblocks: 0,
      approval: 0,
      productivity: 0,
      voters_cnt: 0,
      register_timestamp: 69467831
    },
    {
      rank: 178,
      username: 'testnet.ledger',
      address: '7598242323994637180R',
      publicKey:
        '89627d58cc07c3a5579c9ad78ea4e854a7aee26dbdd3d317d3e3f31a237f799a',
      vote: 0,
      producedblocks: 0,
      missedblocks: 0,
      approval: 0,
      productivity: 0,
      voters_cnt: 0,
      register_timestamp: 71969064
    }
  ]
};

// TODO add `infos`
export const serverAccountsDelegates = {
  success: true,
  delegates: [
    {
      address: '1561814156208456297R',
      approval: 0.99,
      missedblocks: 154,
      producedblocks: 9246,
      productivity: 98.36,
      publicKey:
        '1588cd0df80b8314a22713bdd2b9e9b7868f590603792c99d9c4556a52ea9f8b',
      rank: 58,
      rate: 58,
      username: 'genesisDelegate18',
      vote: 110334497019764
    }
  ]
};

// TODO add `infos`
export const serverDelegatesGetByUsername = {
  success: true,
  delegate: {
    username: 'testdelegate3242432',
    address: '2655711995542512317R',
    publicKey:
      '023bab3e17365565d7a796291f8d3bb6878a3083ea520fbd163db713d51b44f9',
    vote: 0,
    producedblocks: 0,
    missedblocks: 0,
    rank: 136,
    approval: 0,
    productivity: 0,
    rate: 136
  }
};

export const serverTransactionDelegates = {
  success: true,
  count: 1,
  transactions: [
    {
      signatures: [],
      id: '1618492539946857804',
      rowId: 17201,
      height: 836297,
      blockId: '5037878439790225029',
      type: 3,
      timestamp: 69547438,
      senderPubData:
        '023bab3e17365565d7a796291f8d3bb6878a3083ea520fbd163db713d51b44f9',
      senderId: '2655711995542512317R',
      recipientId: '2655711995542512317R',
      amount: 0,
      fee: 100000000,
      signature:
        '57d1608b75019346d3479141b6a0066a5e3f1efd1a26025b6ff3e54b81832e003526c86eb8bf684a99dc44322b11e4aad75c97c9024063f6d275798cc9597707',
      signSignature:
        '12b4775f9d2727b6cebc8b7c65f2fed6430dfee5c1f3df22091ce55ec97fb09537a3f52160c41dc18f51c127fe014e0052f6b87b03725abf1305933c473b7907',
      requesterPublicKey: null,
      asset: {
        votes: [
          '-b38965c92ac330c943e1510bf42f9d090569929c6fcd2f3e7f94934d6c8a8f4d'
        ]
      },
      confirmations: 213579
    }
  ]
};

export const config: TConfig = {
  api_url: '',
  api_url_testnet: '',
  api_url_devnet: '',
  domain: '',
  date_format: '',
  explorer_url: '',
  fiat_currencies: [],
  max_drawer_accounts: 5,
  suggested_delegates_cache_sec: 300
};
