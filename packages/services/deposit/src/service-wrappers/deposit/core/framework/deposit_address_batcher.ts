import { DepositAddress } from '@abx-types/deposit'

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
