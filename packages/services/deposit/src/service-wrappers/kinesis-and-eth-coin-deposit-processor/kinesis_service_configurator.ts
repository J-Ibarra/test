import { CryptoCurrency, CurrencyCode } from '@abx-types/reference-data'
import { CurrencyManager } from '@abx-utils/blockchain-currency-gateway'
import {
  processCheckingSuspendedDepositRequest,
  processSuspendedDepositRequestForCurrency,
  processPendingHoldingsTransactionDepositRequestsForCurrency,
  processReceivedDepositRequestForCurrency,
  processTransactionConfirmedDepositRequestsForCurrency,
  DepositGatekeeper,
} from './core'
import { DepositRequestStatus, DepositRequest } from '@abx-types/deposit'
import { loadAllCompletedPTHDepositRequestsAboveMinimumAmount, NEW_KINESIS_DEPOSIT_REQUESTS_QUEUE_URL } from '../../core'
import { getQueuePoller } from '@abx-utils/async-message-consumer'
import { findCurrencyForId } from '@abx-service-clients/reference-data'

const onChainCurrencyManager = new CurrencyManager()
const kinesisCryptoCurrencies = [CryptoCurrency.kau, CryptoCurrency.kag]

export async function configureKinesisDepositHandler() {
  const [
    receivedDepositsGatekeeper,
    completedPendingHoldingsTransactionGatekeeper,
    pendingHoldingsTransactionConfirmationGatekeeper,
    pendingSuspendedDepositGatekeeper,
    checkingSuspendedDepositGatekeeper,
  ] = await setupDepositRequestGatekeepers()
  subscribeToNewDepositRequestsQueue(receivedDepositsGatekeeper)

  triggerReceivedRequestsProcessor(
    receivedDepositsGatekeeper,
    completedPendingHoldingsTransactionGatekeeper,
    pendingSuspendedDepositGatekeeper,
  )

  triggerPendingHoldingsTransactionRequestsProcessor(
    completedPendingHoldingsTransactionGatekeeper,
    pendingHoldingsTransactionConfirmationGatekeeper,
  )

  triggerTransactionConfirmedRequestsProcessor(
    pendingHoldingsTransactionConfirmationGatekeeper,
  )
  
  triggerSuspendedDepositChecker(
    pendingSuspendedDepositGatekeeper, 
    checkingSuspendedDepositGatekeeper, 
    completedPendingHoldingsTransactionGatekeeper
  )
}

async function setupDepositRequestGatekeepers() {
  const receivedDepositsGatekeeper = new DepositGatekeeper('received')
  const completedPendingHoldingsTransactionGatekeeper = new DepositGatekeeper('completed and pending holdings transaction')
  const pendingHoldingsTransactionConfirmationGatekeeper = new DepositGatekeeper('pending holdings transaction confirmation')
  const pendingSuspendedDepositGatekeeper = new DepositGatekeeper('pending suspended account deposit')
  const checkingSuspendedDepositGatekeeper = new DepositGatekeeper('checking suspended account deposit')

  await Promise.all([
    receivedDepositsGatekeeper.loadGatekeeper(DepositRequestStatus.received),
    completedPendingHoldingsTransactionGatekeeper.loadGatekeeper(
      DepositRequestStatus.completedPendingHoldingsTransaction,
      loadAllCompletedPTHDepositRequestsAboveMinimumAmount,
    ),
    pendingHoldingsTransactionConfirmationGatekeeper.loadGatekeeper(DepositRequestStatus.pendingHoldingsTransactionConfirmation),
    checkingSuspendedDepositGatekeeper.loadGatekeeper(DepositRequestStatus.suspended),
  ])

  return [
    receivedDepositsGatekeeper,
    completedPendingHoldingsTransactionGatekeeper,
    pendingHoldingsTransactionConfirmationGatekeeper,
    pendingSuspendedDepositGatekeeper,
    checkingSuspendedDepositGatekeeper,
  ]
}

function triggerReceivedRequestsProcessor(
  receivedDepositsGatekeeper: DepositGatekeeper,
  completedPendingHoldingsTransactionGatekeeper: DepositGatekeeper,
  pendingSuspendedDepositGatekeeper: DepositGatekeeper,
  ) {
  setInterval(
    async () =>
      await Promise.all(
        kinesisCryptoCurrencies.map((currency) =>
          processReceivedDepositRequestForCurrency(
            receivedDepositsGatekeeper,
            completedPendingHoldingsTransactionGatekeeper,
            pendingSuspendedDepositGatekeeper,
            (currency as unknown) as CurrencyCode,
            onChainCurrencyManager,
          ),
        ),
      ),
    1_000,
  )
}

function triggerPendingHoldingsTransactionRequestsProcessor(
  completedPendingHoldingsTransactionGatekeeper: DepositGatekeeper,
  pendingHoldingsTransactionConfirmationGatekeeper: DepositGatekeeper,
) {
  setInterval(
    async () =>
      await Promise.all(
        kinesisCryptoCurrencies.map((currency) =>
          processPendingHoldingsTransactionDepositRequestsForCurrency(
            completedPendingHoldingsTransactionGatekeeper,
            pendingHoldingsTransactionConfirmationGatekeeper,
            (currency as unknown) as CurrencyCode,
            onChainCurrencyManager,
          ),
        ),
      ),
    3_000,
  )
}

function triggerTransactionConfirmedRequestsProcessor(
  pendingHoldingsTransactionConfirmationGatekeeper: DepositGatekeeper,
  ) {
  setInterval(
    async () =>
      await Promise.all(
        kinesisCryptoCurrencies.map((currency) =>
          processTransactionConfirmedDepositRequestsForCurrency(
            pendingHoldingsTransactionConfirmationGatekeeper,
            (currency as unknown) as CurrencyCode,
            onChainCurrencyManager,
          ),
        ),
      ),
    5_000,
  )
}

function triggerSuspendedDepositChecker(
  pendingSuspendedDepositGatekeeper: DepositGatekeeper,
  checkingSuspendedDepositGatekeeper: DepositGatekeeper,
  completedPendingHoldingsTransactionGatekeeper: DepositGatekeeper,
) {
  setInterval(async () => {
    await Promise.all(
      kinesisCryptoCurrencies.map((currency) =>
        processSuspendedDepositRequestForCurrency(
          pendingSuspendedDepositGatekeeper,
          checkingSuspendedDepositGatekeeper,
          (currency as unknown) as CurrencyCode,
        ),
      ),
    )
    await Promise.all(
      kinesisCryptoCurrencies.map((currency) =>
        processCheckingSuspendedDepositRequest(
          checkingSuspendedDepositGatekeeper,
          completedPendingHoldingsTransactionGatekeeper,
          (currency as unknown) as CurrencyCode,
        ),
      ),
    )
  }, 1_800_000)
}

function subscribeToNewDepositRequestsQueue(receivedDepositsGatekeeper: DepositGatekeeper) {
  const queuePoller = getQueuePoller()

  queuePoller.subscribeToQueueMessages<DepositRequest[]>(NEW_KINESIS_DEPOSIT_REQUESTS_QUEUE_URL, async (depositRequests) => {
    const currency = await findCurrencyForId(depositRequests[0].depositAddress.currencyId)
    receivedDepositsGatekeeper.addNewDepositsForCurrency(currency.code, depositRequests)
  })
}
