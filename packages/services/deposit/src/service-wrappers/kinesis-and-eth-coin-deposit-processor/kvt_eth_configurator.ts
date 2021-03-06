import { CryptoCurrency, CurrencyCode } from '@abx-types/reference-data'
import { CurrencyManager } from '@abx-utils/blockchain-currency-gateway'
import {
  processNewestDepositRequestForCurrency,
  cleanExpiredFailedRequests,
  loadAllHoldingsTransactionFailedRequestsInMemory,
  processCheckingSuspendedDepositRequest,
  processSuspendedDepositRequestForCurrency,
  processCompletionPendingDepositRequestForCurrency,
  DepositGatekeeper,
} from './core'
import { DepositRequestStatus, DepositRequest } from '@abx-types/deposit'
import { loadAllPendingDepositRequestsAboveMinimumAmount, NEW_ETH_AND_KVT_DEPOSIT_REQUESTS_QUEUE_URL } from '../../core'
import { getQueuePoller } from '@abx-utils/async-message-consumer'
import { findCurrencyForId } from '@abx-service-clients/reference-data'

const onChainCurrencyManager = new CurrencyManager()
const currenciesForProcessing = [CryptoCurrency.ethereum, CryptoCurrency.kvt]

export async function configureKVTAndETHDepositHandler() {
  const [
    pendingHoldingsTransferGatekeeper,
    pendingCompletionDepositsGatekeeper,
    pendingSuspendedDepositGatekeeper,
    checkingSuspendedDepositGatekeeper,
  ] = await setupDepositRequestGatekeepers()
  subscribeToNewDepositRequestsQueue(pendingHoldingsTransferGatekeeper)

  triggerPendingHoldingsTransferRequestProcessor(
    pendingHoldingsTransferGatekeeper,
    pendingCompletionDepositsGatekeeper,
    pendingSuspendedDepositGatekeeper,
  )
  triggerDepositCompletionProcessor(pendingCompletionDepositsGatekeeper)
  triggerSuspendedDepositChecker(pendingSuspendedDepositGatekeeper, checkingSuspendedDepositGatekeeper, pendingHoldingsTransferGatekeeper)

  await triggerFailedHoldingsTransactionChecker(pendingHoldingsTransferGatekeeper)
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
  setTimeout(() => executeProcessNewestDepositRequestForCurrency(
    pendingHoldingsTransferGatekeeper,
    pendingCompletionDepositsGatekeeper,
    suspendedDepositGatekeeper,
  ), 3_000)
}

async function executeProcessNewestDepositRequestForCurrency(
  pendingHoldingsTransferGatekeeper: DepositGatekeeper,
  pendingCompletionDepositsGatekeeper: DepositGatekeeper,
  suspendedDepositGatekeeper: DepositGatekeeper,
) {
  try {
    await Promise.all(
      currenciesForProcessing.map((currency) =>
        processNewestDepositRequestForCurrency(
          pendingHoldingsTransferGatekeeper,
          pendingCompletionDepositsGatekeeper,
          suspendedDepositGatekeeper,
          (currency as unknown) as CurrencyCode,
          onChainCurrencyManager,
        ),
      ),
    )
  } finally {
    setTimeout(() => executeProcessNewestDepositRequestForCurrency(
      pendingHoldingsTransferGatekeeper,
      pendingCompletionDepositsGatekeeper,
      suspendedDepositGatekeeper,
    ), 3_000)
  }
}

function triggerDepositCompletionProcessor(pendingCompletionDepositsGatekeeper: DepositGatekeeper) {
  setInterval(
    async () =>
      await Promise.all(
        currenciesForProcessing.map((currency) =>
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

async function triggerFailedHoldingsTransactionChecker(pendingHoldingsTransferGatekeeper: DepositGatekeeper) {
  await loadAllHoldingsTransactionFailedRequestsInMemory()
  setInterval(async () => await cleanExpiredFailedRequests(pendingHoldingsTransferGatekeeper), 5_000)
}

function triggerSuspendedDepositChecker(
  pendingSuspendedDepositGatekeeper: DepositGatekeeper,
  checkingSuspendedDepositGatekeeper: DepositGatekeeper,
  pendingHoldingsTransferGatekeeper: DepositGatekeeper,
) {
  setInterval(async () => {
    await Promise.all(
      currenciesForProcessing.map((currency) =>
        processSuspendedDepositRequestForCurrency(
          pendingSuspendedDepositGatekeeper,
          checkingSuspendedDepositGatekeeper,
          (currency as unknown) as CurrencyCode,
        ),
      ),
    )
    await Promise.all(
      currenciesForProcessing.map((currency) =>
        processCheckingSuspendedDepositRequest(
          checkingSuspendedDepositGatekeeper,
          pendingHoldingsTransferGatekeeper,
          (currency as unknown) as CurrencyCode,
        ),
      ),
    )
  }, 1_800_000)
}

function subscribeToNewDepositRequestsQueue(pendingHoldingsTransferGatekeeper: DepositGatekeeper) {
  const queuePoller = getQueuePoller()

  queuePoller.subscribeToQueueMessages<DepositRequest[]>(NEW_ETH_AND_KVT_DEPOSIT_REQUESTS_QUEUE_URL, async (depositRequests) => {
    const currency = await findCurrencyForId(depositRequests[0].depositAddress.currencyId)
    pendingHoldingsTransferGatekeeper.addNewDepositsForCurrency(currency.code, depositRequests)
  })
}
