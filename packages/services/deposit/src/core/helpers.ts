import { CurrencyCode } from '@abx-types/reference-data'
import { getCurrencyId } from '@abx-service-clients/reference-data'
import { DepositAddress, DepositRequest } from '@abx-types/deposit'
import { sendAsyncChangeMessage } from '@abx-utils/async-message-publisher'

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

  depositAddresses.forEach((depositRequest) => {
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

export function pushRequestForProcessing(depositRequests: DepositRequest[], target: string) {
  return sendAsyncChangeMessage<DepositRequest[]>({
    id: `withdrawal-transaction-sent-${depositRequests.map(({ id }) => id!)}`,
    type: 'new-deposit-request',
    target: {
      local: target!,
      deployedEnvironment: target!,
    },
    payload: depositRequests,
  })
}
