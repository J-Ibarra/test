import { getEnvironment, DepositPollingFrequency, CryptoCurrency, Currency, CurrencyCode } from '@abx-types/reference-data'
import { CurrencyManager } from '@abx-utils/blockchain-currency-gateway'
import {
  checkForNewDepositsForCurrency,
  processNewestDepositRequestForCurrency,
  cleanExpiredFailedRequests,
  loadAllHoldingsTransactionFailedRequestsInMemory,
  loadLastSeenTransactionHashes,
  processCheckingSuspendedDepositRequest,
  processSuspendedDepositRequestForCurrency,
  DepositGatekeeper,
  processCompletionPendingDepositRequestForCurrency,
} from './core'
import { DepositRequestStatus } from '@abx-types/deposit'
import { getAllPendingDepositRequestsForCurrencyAboveMinimumAmount, loadAllPendingDepositRequestsAboveMinimumAmount } from '../../core'
import { findCurrencyForCodes } from '@abx-service-clients/reference-data'

const onChainCurrencyManager = new CurrencyManager(getEnvironment())

export async function configureDepositHandler(depositPollingFrequencyConfig: DepositPollingFrequency[]) {
  const [
    pendingHoldingsTransferGatekeeper,
    pendingCompletionDepositsGatekeeper,
    pendingSuspendedDepositGatekeeper,
    checkingSuspendedDepositGatekeeper,
  ] = await setupDepositRequestGatekeepers()

  await loadLastSeenTransactionHashes()

  triggerNewDepositPoller(depositPollingFrequencyConfig, pendingHoldingsTransferGatekeeper)
  triggerPendingHoldingsTransferRequestProcessor(
    pendingHoldingsTransferGatekeeper,
    pendingCompletionDepositsGatekeeper,
    pendingSuspendedDepositGatekeeper,
  )
  triggerDepositCompletionProcessor(pendingCompletionDepositsGatekeeper)
  triggerSuspendedDepositChecker(pendingSuspendedDepositGatekeeper, checkingSuspendedDepositGatekeeper, pendingHoldingsTransferGatekeeper)

  await triggerFailedHoldingsTransactionChecker(pendingHoldingsTransferGatekeeper)

  const [ethereum, kvt] = await findCurrencyForCodes([CurrencyCode.ethereum, CurrencyCode.kvt])
  hydrateGatekeeperWithNewDeposits(pendingHoldingsTransferGatekeeper, ethereum)
  hydrateGatekeeperWithNewDeposits(pendingHoldingsTransferGatekeeper, kvt)
}

async function setupDepositRequestGatekeepers() {
  const pendingSuspendedDepositGatekeeper = new DepositGatekeeper('pending suspended account deposit')
  const checkingSuspendedDepositGatekeeper = new DepositGatekeeper('checking suspended account deposit')
  const pendingHoldingsTransferGatekeeper = new DepositGatekeeper('pending holdings transfer')
  const pendingCompletionDepositsGatekeeper = new DepositGatekeeper('pending completion')

  await Promise.all([
    pendingHoldingsTransferGatekeeper.loadGatekeeper(
      DepositRequestStatus.pendingHoldingsTransaction,
      loadAllPendingDepositRequestsAboveMinimumAmount,
    ),
    pendingCompletionDepositsGatekeeper.loadGatekeeper(DepositRequestStatus.pendingCompletion),
    checkingSuspendedDepositGatekeeper.loadGatekeeper(DepositRequestStatus.suspended),
  ])

  return [
    pendingHoldingsTransferGatekeeper,
    pendingCompletionDepositsGatekeeper,
    pendingSuspendedDepositGatekeeper,
    checkingSuspendedDepositGatekeeper,
  ]
}

function triggerPendingHoldingsTransferRequestProcessor(
  pendingHoldingsTransferGatekeeper: DepositGatekeeper,
  pendingCompletionDepositsGatekeeper: DepositGatekeeper,
  suspendedDepositGatekeeper: DepositGatekeeper,
) {
  setInterval(
    async () =>
      await Promise.all(
        Object.values(CryptoCurrency).map(currency =>
          processNewestDepositRequestForCurrency(
            pendingHoldingsTransferGatekeeper,
            pendingCompletionDepositsGatekeeper,
            suspendedDepositGatekeeper,
            (currency as unknown) as CurrencyCode,
            onChainCurrencyManager,
          ),
        ),
      ),
    5_000,
  )
}

function triggerDepositCompletionProcessor(pendingCompletionDepositsGatekeeper: DepositGatekeeper) {
  setInterval(
    async () =>
      await Promise.all(
        Object.values(CryptoCurrency).map(currency =>
          processCompletionPendingDepositRequestForCurrency(
            pendingCompletionDepositsGatekeeper,
            (currency as unknown) as CurrencyCode,
            onChainCurrencyManager,
          ),
        ),
      ),
    1_000,
  )
}

function triggerNewDepositPoller(depositPollingFrequencyConfig: DepositPollingFrequency[], pendingHoldingsTransferGatekeeper: DepositGatekeeper) {
  depositPollingFrequencyConfig.forEach(({ currency, frequency }) =>
    setInterval(async () => await checkForNewDepositsForCurrency(pendingHoldingsTransferGatekeeper, currency, onChainCurrencyManager), frequency),
  )
}

async function triggerFailedHoldingsTransactionChecker(pendingHoldingsTransferGatekeeper: DepositGatekeeper) {
  await loadAllHoldingsTransactionFailedRequestsInMemory()
  setInterval(async () => await cleanExpiredFailedRequests(pendingHoldingsTransferGatekeeper), 50_000)
}

/** This mechanism is required in order to take all the deposit requests recorded by the block followers (currently ETH and KVT). */
async function hydrateGatekeeperWithNewDeposits(pendingHoldingsTransferGatekeeper: DepositGatekeeper, currency: Currency) {
  const newPendingDeposits = await getAllPendingDepositRequestsForCurrencyAboveMinimumAmount(currency)

  const depositIdsInGatekeeper = pendingHoldingsTransferGatekeeper.getAllDepositsForCurrency(currency.code).map(({ id }) => id)
  pendingHoldingsTransferGatekeeper.addNewDepositsForCurrency(
    currency.code,
    newPendingDeposits.filter(newDeposit => !depositIdsInGatekeeper.includes(newDeposit.id)),
  )

  setTimeout(() => hydrateGatekeeperWithNewDeposits(pendingHoldingsTransferGatekeeper, currency), 30_000)
}

function triggerSuspendedDepositChecker(
  pendingSuspendedDepositGatekeeper: DepositGatekeeper,
  checkingSuspendedDepositGatekeeper: DepositGatekeeper,
  pendingHoldingsTransferGatekeeper: DepositGatekeeper,
) {
  setInterval(async () => {
    await Promise.all(
      Object.values(CryptoCurrency).map(currency =>
        processSuspendedDepositRequestForCurrency(
          pendingSuspendedDepositGatekeeper,
          checkingSuspendedDepositGatekeeper,
          (currency as unknown) as CurrencyCode,
        ),
      ),
    )
    await Promise.all(
      Object.values(CryptoCurrency).map(currency =>
        processCheckingSuspendedDepositRequest(
          checkingSuspendedDepositGatekeeper,
          pendingHoldingsTransferGatekeeper,
          (currency as unknown) as CurrencyCode,
        ),
      ),
    )
  }, 1_800_000)
}
