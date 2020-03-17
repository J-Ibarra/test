import { ERC20TokenCurrencyGatewaySkeleton } from './ERC20TokenCurrencyGatewaySkeleton'
import { CurrencyCode, Environment } from '@abx-types/reference-data'

import Tether from './contracts/tether/Tether.json'
import TetherRopstenFaucetContract from './contracts/tether/TetherRopstenFaucetContract.json'

const tetherAddress = {
  mainnet: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  ropsten: '0x7c619efddb1b941ec124508421d0034436ed00c1',
}

export class TetherOnChainCurrencyGateway extends ERC20TokenCurrencyGatewaySkeleton {
  private ropstenFaucetContract

  constructor(env: Environment) {
    super(env)
    this.ropstenFaucetContract = new this.web3.eth.Contract(TetherRopstenFaucetContract.abi)
    this.ropstenFaucetContract.options.address = '0xb709ddA2Baec47c77Dbe1C1bBdDE3b3CC0741b94'
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
    return Tether.abi
  }

  async topUpTestnetAccount() {
    await this.web3.eth.personal.unlockAccount('0xf8bEC6334E1B5421BECB8C711A6eEEcf2fF2A51f', '2604BorisLemon', 60)

    return new Promise((resolve, reject) => {
      this.ropstenFaucetContract.methods.dripMe().send({ from: '0xf8bEC6334E1B5421BECB8C711A6eEEcf2fF2A51f' }, (error, txHash) => {
        // handle the error here
        if (!!error) {
          reject('USDT topup failed')
        }

        if (!error && txHash) {
          resolve('Done')
        }
      })
    })
  }
}
