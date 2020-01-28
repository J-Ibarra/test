import { Logger } from '@abx-utils/logging'
import { CurrencyManager } from '@abx-query-libs/blockchain-currency-gateway'
import { sequelize, wrapInTransaction } from '@abx-utils/db-connection-utils'
import { CurrencyCode } from '@abx-types/reference-data'
import { DepositAddress } from '@abx-types/deposit'
import {
  getPendingDepositRequests,
  storeDepositRequests,
  findKycOrEmailVerifiedDepositAddresses,
  splitDepositAddressesIntoBatches,
} from '../../../../core'
import { getPotentialDepositRequests } from '../deposit_transactions_fetcher'
import { depositAmountAboveMinimumForCurrency } from './deposit_amount_validator'
import { DepositGatekeeper } from './deposit_gatekeeper'
import { findCurrencyForCode } from '@abx-service-clients/reference-data'

const logger = Logger.getInstance('new_deposits_poller', 'checkForNewDepositsForCurrency')
const depositPollingBatchSize = Number(process.env.DEPOSIT_POLLING_BATCH_SIZE || 1000) //

// Keeps a flag of 'true' for all currencies where the deposit recording is in progress
const depositPollerRunningStateRecorder: Map<CurrencyCode, boolean> = new Map()

export async function checkForNewDepositsForCurrency(
  pendingHoldingsTransferGatekeeper: DepositGatekeeper,
  currencyCode: CurrencyCode,
  onChainCurrencyManager: CurrencyManager,
) {
  if (!depositPollerRunningStateRecorder.get(currencyCode)) {
    depositPollerRunningStateRecorder.set(currencyCode, true)
    try {
      await recordAllNewDeposits(pendingHoldingsTransferGatekeeper, currencyCode, onChainCurrencyManager)
    } catch (e) {
      logger.error(`Error encountered while recording new deposits for ${currencyCode}`)
      logger.error(JSON.stringify(e))
    } finally {
      depositPollerRunningStateRecorder.set(currencyCode, false)
    }
  }
}

async function recordAllNewDeposits(
  pendingHoldingsTransferGatekeeper: DepositGatekeeper,
  currencyCode: CurrencyCode,
  onChainCurrencyManager: CurrencyManager,
): Promise<void> {
  const { id: currencyId } = await findCurrencyForCode(currencyCode)
  const addresses = await findKycOrEmailVerifiedDepositAddresses(currencyId)
  logger.debug(`Found All Deposit Addresses for ${currencyCode}: ${addresses.length}`)

  const existingPendingDeposits = await getPendingDepositRequests(currencyId)
  const existingPendingDepositTxHashes = existingPendingDeposits.map(pendingDeposit => pendingDeposit.depositTxHash)

  const depositAddressBatches = splitDepositAddressesIntoBatches(addresses, depositPollingBatchSize)

  for (const depositAddressBatch of depositAddressBatches) {
    await fetchNewPotentialDepositsForAddresses(
      pendingHoldingsTransferGatekeeper,
      currencyCode,
      depositAddressBatch,
      existingPendingDepositTxHashes,
      onChainCurrencyManager,
    )
  }
}

async function fetchNewPotentialDepositsForAddresses(
  pendingHoldingsTransferGatekeeper,
  currencyCode: CurrencyCode,
  addresses: DepositAddress[],
  existingPendingDepositTxHashes: string[],
  onChainCurrencyManager: CurrencyManager,
) {
  const newDepositRequests = await getPotentialDepositRequests(onChainCurrencyManager, addresses)
  logger.debug(`Found ${newDepositRequests.length} potential deposit requests`)
  logger.debug(JSON.stringify(newDepositRequests))

  if (addresses.length > 0) {
    return wrapInTransaction(sequelize, null, async transaction => {
      const freshDepositRequestsToStore = newDepositRequests.filter(req => {
        return !existingPendingDepositTxHashes.includes(req.depositTxHash)
      })

      logger.debug(`${freshDepositRequestsToStore.length} new deposit requests for ${currencyCode} to persist`)
      const storedDepositRequests = await storeDepositRequests(freshDepositRequestsToStore, transaction)

      return pendingHoldingsTransferGatekeeper.addNewDepositsForCurrency(
        currencyCode,
        storedDepositRequests.filter(depositRequest => depositAmountAboveMinimumForCurrency(depositRequest.amount, currencyCode)),
      )
    })
  }
}
