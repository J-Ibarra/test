import { Logger } from '@abx-utils/logging'
import { CryptoCurrency, getEnvironment } from '@abx-types/reference-data'
import {
  completeWithdrawal,
  CryptoWithdrawalGatekeeper,
  transferCryptoForLatestWithdrawalRequest,
  PENDING_HOLDINGS_WITHDRAWAL_GATEKEEPER_NAME,
  PENDING_COMPLETION_WITHDRAWAL_GATEKEEPER_NAME,
} from './core/framework'
import { WithdrawalState } from '@abx-types/withdrawal'
import { CurrencyManager } from '@abx-utils/blockchain-currency-gateway'

export * from './core/framework'
export * from './core/lib'

const onChainCurrencyManager = new CurrencyManager(getEnvironment())

const logger = Logger.getInstance('withdrawal-bootstrap', 'configureWithdrawalHandler')

export async function configureWithdrawalHandler() {
  const [pendingHoldingsAccountTransferGatekeeper, pendingCompletionGatekeeper] = await setupWithdrawalRequestGatekeepers()

  setupPendingHoldingAccountTransferCryptoWithdrawalProcessor(pendingHoldingsAccountTransferGatekeeper, pendingCompletionGatekeeper)
  logger.debug('Holdings transfer interval created')

  setupPendingCompletionCryptoWithdrawalProcessor(pendingCompletionGatekeeper)
}

async function setupPendingHoldingAccountTransferCryptoWithdrawalProcessor(
  pendingHoldingsTransferGatekeeper: CryptoWithdrawalGatekeeper,
  pendingCompletionWithdrawalGatekeeper: CryptoWithdrawalGatekeeper,
) {
  setInterval(
    async () =>
      await Promise.all(
        Object.values(CryptoCurrency).map(currency =>
          transferCryptoForLatestWithdrawalRequest(
            currency as any,
            onChainCurrencyManager,
            pendingHoldingsTransferGatekeeper,
            pendingCompletionWithdrawalGatekeeper,
          ),
        ),
      ),
    5_000,
  )
}

async function setupPendingCompletionCryptoWithdrawalProcessor(pendingCompletionWithdrawalGatekeeper: CryptoWithdrawalGatekeeper) {
  setInterval(
    async () =>
      await Promise.all(
        Object.values(CryptoCurrency).map(currency =>
          completeWithdrawal(currency as any, onChainCurrencyManager, pendingCompletionWithdrawalGatekeeper),
        ),
      ),
    5_000,
  )
}

async function setupWithdrawalRequestGatekeepers() {
  const pendingHoldingsTransferGatekeeper = CryptoWithdrawalGatekeeper.getSingletonInstance(PENDING_HOLDINGS_WITHDRAWAL_GATEKEEPER_NAME)
  const pendingCompletionDepositsGatekeeper = new CryptoWithdrawalGatekeeper(PENDING_COMPLETION_WITHDRAWAL_GATEKEEPER_NAME)

  await Promise.all([
    pendingHoldingsTransferGatekeeper.loadGatekeeper(WithdrawalState.pending),
    pendingCompletionDepositsGatekeeper.loadGatekeeper(WithdrawalState.holdingsTransactionCompleted),
  ])

  logger.debug('Loaded gatekeepers')
  return [pendingHoldingsTransferGatekeeper, pendingCompletionDepositsGatekeeper]
}
