import { CurrencyCode } from '@abx-types/reference-data'
import { getModel } from '@abx-utils/db-connection-utils'
import { findCurrencies } from '../core/symbols/currency_in_memory_cache'

export async function updateCurrencyEnabledStatus(code: CurrencyCode, value: boolean) {
  await getModel('currency').update(
    {
      isEnabled: value,
    },
    {
      where: {
        code,
      },
    },
  )
}

export async function updateSymbolsForCurrencyWithStatus(code: CurrencyCode, value: boolean) {
  const currencies = await findCurrencies()

  const currencyForCode = currencies.find((c) => c.code === code)!.id
  const currencyIds = currencies.map((c) => c.id)

  await getModel('symbol').update(
    {
      isEnabled: value,
    },
    {
      where: {
        baseId: currencyIds,
        quoteId: currencyIds,
        $or: {
          baseId: currencyForCode,
          quoteId: currencyForCode,
        },
      },
    },
  )
}
