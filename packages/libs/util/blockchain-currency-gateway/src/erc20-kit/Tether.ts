import { ERC20Gateway } from './ERC20Gateway'

import { CurrencyCode, Environment } from '@abx-types/reference-data'

import Tether from './contracts/Tether.json'

const tetherAddress = {
  mainnet: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  ropsten: '0x7c619efddb1b941ec124508421d0034436ed00c1',
}

export class TetherERC20GatewayAdapter extends ERC20Gateway {
  constructor(env: Environment) {
    super(env)
  }
  getWeb3Config(env: Environment) {
    return env === Environment.production
      ? `https://mainnet.infura.io/v3/${process.env.KVT_INFURA_PROJECT_ID}`
      : `https://ropsten.infura.io/v3/${process.env.KVT_INFURA_PROJECT_ID}`
  }
  getCurrencyCode(): CurrencyCode {
    return CurrencyCode.tether
  }
  getContractAddress(env: Environment): string {
    return env === Environment.production ? tetherAddress.mainnet : tetherAddress.ropsten
  }
  getABI(_env: Environment) {
    return Tether.abi
  }
}
