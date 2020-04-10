import { ERC20TokenCurrencyGatewaySkeleton } from './ERC20TokenCurrencyGatewaySkeleton'
import { CurrencyCode, Environment } from '@abx-types/reference-data'

import KinesisVelocityToken from './contracts/kvt/KinesisVelocityToken.json'

const kvtAddress = {
  mainnet: '0x3a859b9ea4998D344547283C7Ce8EBc4aBb77656',
  ropsten: '0x05cB21867dda44391F7a1fd32940E7D7B1280273',
}

export class KvtOnChainCurrencyGateway extends ERC20TokenCurrencyGatewaySkeleton {
  constructor(env: Environment) {
    super(env)
  }

  getWeb3Config(env: Environment) {
    return env === Environment.production
      ? `https://mainnet.infura.io/v3/${process.env.KVT_INFURA_PROJECT_ID}`
      : `https://ropsten.infura.io/v3/${process.env.KVT_INFURA_PROJECT_ID}`
  }

  getCurrencyCode(): CurrencyCode {
    return CurrencyCode.kvt
  }

  getContractAddress(env: Environment): string {
    return env === Environment.production ? kvtAddress.mainnet : kvtAddress.ropsten
  }

  getABI(_env: Environment) {
    return KinesisVelocityToken.abi
  }

  getTokenDecimals() {
    return 0
  }
}
