import { CurrencyCode } from '@abx-types/reference-data'
import { getCurrencyId } from '@abx-service-clients/reference-data'

export async function getDepositFeeCurrencyId(currency: CurrencyCode) {
  if (currency === CurrencyCode.kvt) {
    return getCurrencyId(CurrencyCode.ethereum)
  }

  const feeCurrencyId = await getCurrencyId(currency)
  return feeCurrencyId
}
