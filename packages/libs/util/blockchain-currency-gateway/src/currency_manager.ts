import { Environment } from '@abx-types/reference-data'
import { CurrencyCode } from '@abx-types/reference-data'
import { getCurrencyCode } from '@abx-service-clients/reference-data'
import { OnChainCurrencyGateway } from './currency_gateway'
import { BitcoinOnChainCurrencyGatewayAdapter } from './bitcoin/BitcoinOnChainCurrencyGatewayAdapter'
import { Ethereum } from './ethereum'
import { Kinesis } from './kinesis'
import { KvtOnChainCurrencyGateway } from './erc20-tokens/KvtOnChainCurrencyGateway'
import { TetherOnChainCurrencyGateway } from './erc20-tokens/TetherOnChainCurrencyGateway'
import { YeenusTestTokenOnChainCurrencyGateway } from './erc20-tokens/YeenusTestTokenOnChainCurrencyGateway'

export class CurrencyManager {
  protected currencies: { [ticker: string]: OnChainCurrencyGateway }

  constructor(env: Environment, enabledCurrencies: CurrencyCode[] = []) {
    this.setupCurrencies(env, enabledCurrencies)
  }

  public getCurrencyFromTicker(ticker: CurrencyCode): OnChainCurrencyGateway {
    const currency = this.currencies[ticker]
    if (!currency) {
      throw new Error(`Currency ${ticker} is not implemented`)
    }
    return currency
  }

  public async getCurrencyFromId(id: number): Promise<OnChainCurrencyGateway> {
    const ticker = await getCurrencyCode(id)
    return this.getCurrencyFromTicker(ticker!)
  }

  protected setupCurrencies(env: Environment, enabledCurrencies: CurrencyCode[]) {
    const currencies = {
      [CurrencyCode.kau]: new Kinesis(env, CurrencyCode.kau),
      [CurrencyCode.kag]: new Kinesis(env, CurrencyCode.kag),

      [CurrencyCode.ethereum]: new Ethereum(env),
      [CurrencyCode.bitcoin]: new BitcoinOnChainCurrencyGatewayAdapter(),

      [CurrencyCode.kvt]: new KvtOnChainCurrencyGateway(env),
      [CurrencyCode.tether]: new TetherOnChainCurrencyGateway(env),
      [CurrencyCode.yeenus]: new YeenusTestTokenOnChainCurrencyGateway(env),
    }

    this.currencies = Object.entries(currencies)
      .filter(([key]) => enabledCurrencies.length === 0 || enabledCurrencies.includes(key as CurrencyCode))
      .reduce((agg, entry) => ({ ...agg, [entry[0]]: entry[1] }), {})
  }
}
