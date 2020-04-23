import { Environment } from '@abx-types/reference-data'
import { CurrencyCode } from '@abx-types/reference-data'
import { getCurrencyCode } from '@abx-service-clients/reference-data'
import { OnChainCurrencyGateway } from './currency_gateway'
import { BitcoinOnChainCurrencyGatewayAdapter } from './bitcoin/BitcoinOnChainCurrencyGatewayAdapter'
import { Ethereum } from './ethereum'
import { Kinesis } from './kinesis'
import { KvtOnChainCurrencyGateway } from './erc20-tokens/KvtOnChainCurrencyGateway'
import { TetherOnChainCurrencyGateway } from './erc20-tokens/TetherOnChainCurrencyGateway'

export class CurrencyManager {
  static readonly currencies = {
    [CurrencyCode.kau]: new Kinesis(process.env.NODE_ENV as Environment, CurrencyCode.kau),
    [CurrencyCode.kag]: new Kinesis(process.env.NODE_ENV as Environment, CurrencyCode.kag),

    [CurrencyCode.ethereum]: new Ethereum(process.env.NODE_ENV as Environment),
    [CurrencyCode.bitcoin]: new BitcoinOnChainCurrencyGatewayAdapter(),

    [CurrencyCode.kvt]: new KvtOnChainCurrencyGateway(process.env.NODE_ENV as Environment),
    [CurrencyCode.tether]: new TetherOnChainCurrencyGateway(process.env.NODE_ENV as Environment),
  }

  public getCurrencyFromTicker(ticker: CurrencyCode): OnChainCurrencyGateway {
    const currency = CurrencyManager.currencies[ticker]
    if (!currency) {
      throw new Error(`Currency ${ticker} is not implemented`)
    }
    return currency
  }

  public async getCurrencyFromId(id: number): Promise<OnChainCurrencyGateway> {
    const ticker = await getCurrencyCode(id)
    return this.getCurrencyFromTicker(ticker!)
  }
}
