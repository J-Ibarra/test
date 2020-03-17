import { CurrencyCode, Environment } from '@abx-types/reference-data'
import { OnChainCurrencyGateway } from '../currency_gateway'
import { TetherOnChainCurrencyGateway } from './TetherOnChainCurrencyGateway'
import { KvtOnChainCurrencyGateway } from './KvtOnChainCurrencyGateway'
import { YeenusTestTokenOnChainCurrencyGateway } from './YeenusTestTokenOnChainCurrencyGateway'

const currencyGatewayInstances: Record<CurrencyCode, OnChainCurrencyGateway> = {} as any

export function getInstanceForCurrency(env: Environment, currency: CurrencyCode) {
  switch (currency) {
    case CurrencyCode.tether:
      return getSingletonInstance(currency, () => new TetherOnChainCurrencyGateway(env))
    case CurrencyCode.kvt:
      return getSingletonInstance(currency, () => new KvtOnChainCurrencyGateway(env))
    case CurrencyCode.yeenus:
      return getSingletonInstance(currency, () => new YeenusTestTokenOnChainCurrencyGateway(env))
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
