import { ERC20TokenCurrencyGatewaySkeleton } from './ERC20TokenCurrencyGatewaySkeleton'
import { CurrencyCode, Environment } from '@abx-types/reference-data'

import YeenusToken from './contracts/yeenus/YeenusToken.json'
import Tether from './contracts/tether/Tether.json'

const tetherAddress = {
  mainnet: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  ropsten: '0xF6fF95D53E08c9660dC7820fD5A775484f77183A', // The ropsten testnet address is actually pointing to a test ERC20 token - YEENUS(https://github.com/bokkypoobah/WeenusTokenFaucet/blob/master/contracts/YeenusToken.sol)
}

/**
 * The Tether ERC20 token is hard to test in the testnets.
 * Yeenus is used as a replacement ERC20 token which is easy to get hold of and test with.
 */
export class TetherOnChainCurrencyGateway extends ERC20TokenCurrencyGatewaySkeleton {
  private readonly TETHER_DECIMALS = 2
  private readonly YEENUS_DECIMALS = 8

  constructor(env: Environment) {
    super(env)
  }

  getWeb3Config(env: Environment) {
    return env === Environment.production
      ? `https://mainnet.infura.io/v3/${process.env.TETHER_INFURA_PROJECT_ID}`
      : `https://ropsten.infura.io/v3/${process.env.TETHER_INFURA_PROJECT_ID}`
  }

  getCurrencyCode(): CurrencyCode {
    return CurrencyCode.tether
  }

  getContractAddress(env: Environment): string {
    return env === Environment.production ? tetherAddress.mainnet : tetherAddress.ropsten
  }

  getABI(_env: Environment) {
    return _env === Environment.production ? Tether.abi : YeenusToken.abi
  }

  getTokenDecimals(_env?: Environment) {
    return _env === Environment.production ? this.TETHER_DECIMALS : this.YEENUS_DECIMALS
  }
}
