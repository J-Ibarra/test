import { Currency, CurrencyCode } from '@abx-types/reference-data'
import { CurrencyEndpoints } from './endpoints'
import { isCryptoCurrency } from '../utils'
import { InternalApiRequestDispatcher } from '@abx-utils/internal-api-tools'
import { REFERENCE_DATA_REST_API_PORT } from '../boundaries'

const internalApiRequestDispatcher = new InternalApiRequestDispatcher(REFERENCE_DATA_REST_API_PORT)

export async function findAllCurrencyCodes(): Promise<CurrencyCode[]> {
  const currencies = await findAllCurrencies()

  return currencies.map(({ code }) => code)
}

export async function findCryptoCurrencies(): Promise<Currency[]> {
  const allCurrencies = await findAllCurrencies()

  return allCurrencies.filter(({ code }) => isCryptoCurrency(code))
}

export async function findCurrencyForCodes(currencyCodes: CurrencyCode[]): Promise<Currency[]> {
  const allCurrencies = await findAllCurrencies()

  return currencyCodes.map(currencyCode => allCurrencies.find(({ code }) => currencyCode === code)!)
}

export async function findCurrencyForCode(currencyCode: CurrencyCode): Promise<Currency> {
  const allCurrencies = await findAllCurrencies()

  return allCurrencies.find(({ code }) => code === currencyCode)!
}

export async function findCurrencyForId(currencyId: number): Promise<Currency> {
  const allCurrencies = await findAllCurrencies()

  return allCurrencies.find(({ id }) => id === currencyId)!
}

export async function getCurrencyId(currencyCode: CurrencyCode): Promise<number> {
  const allCurrencies = await findAllCurrencies()
  const currency = allCurrencies.find(({ code }) => code === currencyCode)!

  return currency.id
}

export async function getCurrencyCode(currencyId: number) {
  const allCurrencies = await findAllCurrencies()
  const currency = allCurrencies.find(({ id }) => id === currencyId)

  return currency && currency.code
}

export async function findAllCurrencies(): Promise<Currency[]> {
  return internalApiRequestDispatcher.fireRequestToInternalApi<Currency[]>(CurrencyEndpoints.getAllCurrencies)
}

export * from './endpoints'
