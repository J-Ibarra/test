import { Logger } from '@abx-utils/logging'
import { OnChainCurrencyGateway } from '@abx-utils/blockchain-currency-gateway'
import { DepositAddress } from '@abx-types/deposit'
import { CurrencyCode } from '@abx-types/reference-data'
import { findKycOrEmailVerifiedDepositAddresses, depositAmountAboveMinimumForCurrency } from '../../../core'
import { splitDepositAddressesIntoBatches } from '../../../core'

// Makes sure we don't hit any local network or Infura-enforced rate limits
const balanceCheckBatchSize = 2000

const logger = Logger.getInstance('deposit_address_filter', 'filterOutAllAddressesWithPositiveBalance')

export async function filterOutAllAddressesWithPositiveBalance(
  currencyId: number,
  onChainCurrencyManager: OnChainCurrencyGateway,
): Promise<DepositAddress[]> {
  const ethAddresses = await findKycOrEmailVerifiedDepositAddresses(currencyId)
  const depositAddressBatches = await splitDepositAddressesIntoBatches(ethAddresses, balanceCheckBatchSize)

  const depositAddressAccumulator: DepositAddress[] = []

  let batchCounter = 0
  for (const depositAddressBatch of depositAddressBatches) {
    logger.debug(`Processing Address batch: ${++batchCounter}`)

    const depositAddressesWithPositiveBalance = await Promise.all(
      depositAddressBatch.map(depositAddress => returnAddressIfBalancePositive(depositAddress, onChainCurrencyManager)),
    )

    depositAddressAccumulator.push(...(depositAddressesWithPositiveBalance.filter(Boolean) as DepositAddress[]))
  }

  logger.debug(`Deposit addresses with positive balance: ${JSON.stringify(depositAddressAccumulator)}`)
  return depositAddressAccumulator
}

async function returnAddressIfBalancePositive(
  depositAddress: DepositAddress,
  onChainCurrencyManager: OnChainCurrencyGateway,
): Promise<DepositAddress | null> {
  try {
    const balance = await onChainCurrencyManager.balanceAt(depositAddress.publicKey)

    if (depositAmountAboveMinimumForCurrency(balance, CurrencyCode.ethereum)) {
      return depositAddress
    }

    return null
  } catch (e) {
    logger.error(`Unable to check balance at address ${depositAddress.publicKey}`)
    logger.error(e)
    return null
  }
}
