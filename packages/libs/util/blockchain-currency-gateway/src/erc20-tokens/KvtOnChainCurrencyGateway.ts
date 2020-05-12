import { ERC20TokenCurrencyGatewaySkeleton } from './ERC20TokenCurrencyGatewaySkeleton'
import { CurrencyCode, Environment } from '@abx-types/reference-data'

import KinesisVelocityToken from './contracts/kvt/KinesisVelocityToken.json'

const kvtAddress = {
  mainnet: '0x3a859b9ea4998D344547283C7Ce8EBc4aBb77656',
  ropsten: '0x05cB21867dda44391F7a1fd32940E7D7B1280273',
  rinkeby: '0x88D3dF1D9499D2e0F33e7cf9Fad4c6de7971d7d7',
}

export class KvtOnChainCurrencyGateway extends ERC20TokenCurrencyGatewaySkeleton {
  constructor(env: Environment) {
    super(env)
  }

  getWeb3Config(env: Environment) {
    switch (env) {
      case Environment.production:
        return `https://mainnet.infura.io/v3/${process.env.KVT_INFURA_PROJECT_ID}`
      case Environment.yieldUat:
        return `https://rinkeby.infura.io/v3/${process.env.KVT_INFURA_PROJECT_ID}`
      default:
        return `https://ropsten.infura.io/v3/${process.env.KVT_INFURA_PROJECT_ID}`
    }
  }

  getCurrencyCode(): CurrencyCode {
    return CurrencyCode.kvt
  }

  getContractAddress(env: Environment): string {
    switch (env) {
      case Environment.production:
        return kvtAddress.mainnet
      case Environment.yieldUat:
        return kvtAddress.rinkeby
      default:
        return kvtAddress.ropsten
    }
  }

  getABI(_env: Environment) {
    return KinesisVelocityToken.abi
  }

  getTokenDecimals() {
    return 0
  }
}
