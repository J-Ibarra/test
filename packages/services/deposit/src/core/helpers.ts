import { CurrencyCode } from '@abx-types/reference-data'
import { getCurrencyId } from '@abx-service-clients/reference-data'
import { DepositAddress } from '@abx-types/deposit'

export async function getDepositFeeCurrencyId(currency: CurrencyCode) {
  if (currency === CurrencyCode.kvt) {
    return getCurrencyId(CurrencyCode.ethereum)
  }

  const feeCurrencyId = await getCurrencyId(currency)
  return feeCurrencyId
}

export function splitDepositAddressesIntoBatches(depositAddresses: DepositAddress[], batchSize: number): DepositAddress[][] {
  const depositAddressBatches: DepositAddress[][] = []
  let depositBatchCounter = 0

  depositAddresses.forEach(depositRequest => {
    if (!!depositAddressBatches[depositBatchCounter] && depositAddressBatches[depositBatchCounter].length === batchSize) {
      depositBatchCounter++
      depositAddressBatches[depositBatchCounter] = [depositRequest]
    } else {
      depositAddressBatches[depositBatchCounter] = (depositAddressBatches[depositBatchCounter] || []).concat(depositRequest)
    }
  })

  return depositAddressBatches
}

export type AmountTruncationFunction = (amount: number) => number
