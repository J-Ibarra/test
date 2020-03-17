import { CurrencyCode, Environment } from '@abx-types/reference-data'
import { OnChainCurrencyGateway } from '../currency_gateway'
import { TetherOnChainCurrencyGateway } from './TetherOnChainCurrencyGateway'
import { KvtOnChainCurrencyGateway } from './KvtOnChainCurrencyGateway'

const currencyGatewayInstances: Record<CurrencyCode, OnChainCurrencyGateway> = {} as any

export function getInstanceForCurrency(env: Environment, currency: CurrencyCode) {
  if (currency === CurrencyCode.tether) {
    return getSingletonInstance(currency, () => new TetherOnChainCurrencyGateway(env))
  } else if (currency === CurrencyCode.kvt) {
    return getSingletonInstance(currency, () => new KvtOnChainCurrencyGateway(env))
  }

  throw new Error(`Unsupported ${currency} provided when trying to create ERC20TokenCurrencyGateway instance`)
}

function getSingletonInstance(currency: CurrencyCode, currencyFactoryFn: () => OnChainCurrencyGateway) {
  if (!!currencyGatewayInstances[currency]) {
    return !!currencyGatewayInstances[currency]
  }

  this.currencyGatewayInstances[currency] = currencyFactoryFn()

  return this.currencyGatewayInstances[currency]
}
