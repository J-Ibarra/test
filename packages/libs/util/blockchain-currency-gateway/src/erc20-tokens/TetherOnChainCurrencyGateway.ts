import { ERC20TokenCurrencyGatewaySkeleton } from './ERC20TokenCurrencyGatewaySkeleton'
import { CurrencyCode, Environment } from '@abx-types/reference-data'

import YeenusToken from './contracts/yeenus/YeenusToken.json'
import Tether from './contracts/tether/Tether.json'

const tetherAddress = {
  mainnet: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  ropsten: '0xF6fF95D53E08c9660dC7820fD5A775484f77183A', // The ropsten testnet address is actually pointing to a test ERC20 token - YEENUS(https://github.com/bokkypoobah/WeenusTokenFaucet/blob/master/contracts/YeenusToken.sol)
  rinkeby: '0xc6fDe3FD2Cc2b173aEC24cc3f267cb3Cd78a26B7', 
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
    switch (env) {
      case Environment.production:
        return `https://mainnet.infura.io/v3/${process.env.TETHER_INFURA_PROJECT_ID}`
      case Environment.yieldUat:
        return `https://rinkeby.infura.io/v3/${process.env.TETHER_INFURA_PROJECT_ID}`
      default:
        return `https://ropsten.infura.io/v3/${process.env.TETHER_INFURA_PROJECT_ID}`
    }
  }

  getCurrencyCode(): CurrencyCode {
    return CurrencyCode.tether
  }

  getContractAddress(env: Environment): string {
    switch (env) {
      case Environment.production:
        return tetherAddress.mainnet
      case Environment.yieldUat:
        return tetherAddress.rinkeby
      default:
        return tetherAddress.ropsten
    }
  }

  getABI(env: Environment) {
    switch (env) {
      case Environment.production:
        return Tether.abi
      default:
        return YeenusToken.abi
    }
  }

  getTokenDecimals(env?: Environment) {
    switch (env) {
      case Environment.production:
        return this.TETHER_DECIMALS
      default:
        return this.YEENUS_DECIMALS
    }
  }
}
