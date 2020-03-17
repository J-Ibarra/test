import { ERC20TokenCurrencyGatewaySkeleton } from './ERC20TokenCurrencyGatewaySkeleton'
import { CurrencyCode, Environment } from '@abx-types/reference-data'

import YeenusToken from './contracts/yeenus/YeenusToken.json'

const tetherAddress = {
  mainnet: '0x187E63F9eBA692A0ac98d3edE6fEb870AF0079e1',
  ropsten: '0xF6fF95D53E08c9660dC7820fD5A775484f77183A',
}

/**
 * The Yeenus token is a test token that has no value, even in the ETH mainnet.
 * It was implemented as means to easily verify that the ECR20 token deposit and withdrawal flows work.
 */
export class YeenusTestTokenOnChainCurrencyGateway extends ERC20TokenCurrencyGatewaySkeleton {
  constructor(env: Environment) {
    super(env)
  }

  getWeb3Config(env: Environment) {
    return env === Environment.production
      ? `https://mainnet.infura.io/v3/${process.env.YEENUS_INFURA_PROJECT_ID}`
      : `https://ropsten.infura.io/v3/${process.env.YEENUS_INFURA_PROJECT_ID}`
  }

  getCurrencyCode(): CurrencyCode {
    return CurrencyCode.yeenus
  }

  getContractAddress(env: Environment): string {
    return env === Environment.production ? tetherAddress.mainnet : tetherAddress.ropsten
  }

  getABI(_env: Environment) {
    return YeenusToken.abi
  }
}
