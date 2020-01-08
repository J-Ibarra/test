import { CurrencyCode, Environment } from '@abx-types/reference-data'

export const KINESIS_NETWORK_CONFIG = {
  [Environment.development]: {
    [CurrencyCode.kau]: {
      passphrase: 'Kinesis UAT',
      url: 'https://kau-testnet.kinesisgroup.io',
    },
    [CurrencyCode.kag]: {
      passphrase: 'Kinesis KAG UAT',
      url: 'https://kag-testnet.kinesisgroup.io',
    },
  },
  [Environment.test]: {
    [CurrencyCode.kau]: {
      passphrase: 'Test SDF Network ; September 2015',
      url: 'https://local.kinesisgroup.io',
    },
    [CurrencyCode.kag]: {
      passphrase: 'Test SDF Network ; September 2015',
      url: 'https://local.kinesisgroup.io',
    },
  },
  [Environment.e2eLocal]: {
    [CurrencyCode.kau]: {
      passphrase: 'Kinesis UAT',
      url: 'https://kau-testnet.kinesisgroup.io',
    },
    [CurrencyCode.kag]: {
      passphrase: 'Kinesis KAG UAT',
      url: 'https://kag-testnet.kinesisgroup.io',
    },
  },
  [Environment.e2eAws]: {
    [CurrencyCode.kau]: {
      passphrase: 'Kinesis UAT',
      url: 'https://kau-testnet.kinesisgroup.io',
    },
    [CurrencyCode.kag]: {
      passphrase: 'Kinesis KAG UAT',
      url: 'https://kag-testnet.kinesisgroup.io',
    },
  },
  [Environment.integration]: {
    [CurrencyCode.kau]: {
      passphrase: 'Kinesis UAT',
      url: 'https://kau-testnet.kinesisgroup.io',
    },
    [CurrencyCode.kag]: {
      passphrase: 'Kinesis KAG UAT',
      url: 'https://kag-testnet.kinesisgroup.io',
    },
  },
  [Environment.uat]: {
    [CurrencyCode.kau]: {
      passphrase: 'Kinesis UAT',
      url: 'https://kau-testnet.kinesisgroup.io',
    },
    [CurrencyCode.kag]: {
      passphrase: 'Kinesis KAG UAT',
      url: 'https://kag-testnet.kinesisgroup.io',
    },
  },
  [Environment.production]: {
    [CurrencyCode.kau]: {
      passphrase: 'Kinesis Live',
      url: 'https://kau-mainnet.kinesisgroup.io',
    },
    [CurrencyCode.kag]: {
      passphrase: 'Kinesis KAG Live',
      url: 'https://kag-mainnet.kinesisgroup.io',
    },
  },
}
