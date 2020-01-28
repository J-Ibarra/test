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
import { findCurrencyForCode } from '@abx-service-clients/reference-data'

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

  const ethereum = await findCurrencyForCode(CurrencyCode.ethereum)
  hydrateGatekeeperWithNewEthDeposits(pendingHoldingsTransferGatekeeper, ethereum)
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

async function hydrateGatekeeperWithNewEthDeposits(pendingHoldingsTransferGatekeeper: DepositGatekeeper, ethCurrency: Currency) {
  const newPendingDeposits = await getAllPendingDepositRequestsForCurrencyAboveMinimumAmount(ethCurrency)

  const depositIdsInGatekeeper = pendingHoldingsTransferGatekeeper.getAllDepositsForCurrency(ethCurrency.code).map(({ id }) => id)
  pendingHoldingsTransferGatekeeper.addNewDepositsForCurrency(
    CurrencyCode.ethereum,
    newPendingDeposits.filter(newDeposit => !depositIdsInGatekeeper.includes(newDeposit.id)),
  )

  setTimeout(() => hydrateGatekeeperWithNewEthDeposits(pendingHoldingsTransferGatekeeper, ethCurrency), 30_000)
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
