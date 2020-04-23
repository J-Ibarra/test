import { Environment, CurrencyCode } from '@abx-types/reference-data'
import { TestCurrencyManager } from './test_currency_gateway'
import { CurrencyManager } from './currency_manager'

export * from './api-provider'
export * from './currency_gateway'
export * from './currency_manager'
export * from './test_currency_gateway'
export * from './validation.utils'
export * from './model'
export * from './ethereum'
export * from './erc20-tokens/KvtOnChainCurrencyGateway'
export * from './kinesis'
export * from './bitcoin'

export function getOnChainCurrencyManagerForEnvironment(environment: Environment, currencies: CurrencyCode[]) {
  return environment === Environment.test ? new TestCurrencyManager(currencies) : new CurrencyManager(environment, currencies)
}
