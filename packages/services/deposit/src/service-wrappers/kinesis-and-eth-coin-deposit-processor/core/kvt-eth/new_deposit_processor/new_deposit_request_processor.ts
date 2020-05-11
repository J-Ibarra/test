import { isAccountSuspended } from '@abx-service-clients/account'
import { Logger } from '@abx-utils/logging'
import { CurrencyManager } from '@abx-utils/blockchain-currency-gateway'
import { CurrencyCode } from '@abx-types/reference-data'
import { DepositGatekeeper, checkTransactionConfirmation } from '../..'
import { handlerDepositError } from './new_deposit_error_handler'
import { HoldingsTransactionDispatcher } from '../../../../../core'
import { DepositRequestStatus } from '@abx-types/deposit'

const logger = Logger.getInstance('deposit_request_processor', 'processNewestDepositRequestForCurrency')

export async function processNewestDepositRequestForCurrency(
  pendingHoldingsTransferGatekeeper: DepositGatekeeper,
  pendingCompletionGatekeeper: DepositGatekeeper,
  suspendedAccountDepositGatekeeper: DepositGatekeeper,
  currency: CurrencyCode,
  onChainCurrencyManager: CurrencyManager,
) {
  const depositRequest = pendingHoldingsTransferGatekeeper.getNewestDepositForCurrency(currency)

  if (!depositRequest) {
    return
  }

  const depositTransactionConfirmed = await checkTransactionConfirmation(currency, depositRequest, onChainCurrencyManager, logger)
  if (!depositTransactionConfirmed) {
    logger.warn(`Attempted to process request ${depositRequest.id} where the transaction is not yet confirmed`)

    return pendingHoldingsTransferGatekeeper.unlockRequest(currency, depositRequest.id!)
  }
  logger.info(`Deposit transaction for request ${depositRequest.id} confirmed`)

  try {
    const accountIsSuspended = await isAccountSuspended(depositRequest.depositAddress.accountId)

    if (accountIsSuspended) {
      return addToSuspendedAccountGatekeeper(currency, depositRequest, pendingCompletionGatekeeper, suspendedAccountDepositGatekeeper)
    }

    const dispatcher = new HoldingsTransactionDispatcher()
    const updatedDepositRequests = (
      await dispatcher.dispatchHoldingsTransactionForDepositRequests([depositRequest], currency, DepositRequestStatus.pendingCompletion)
    ).filter((dr) => dr.id === depositRequest.id!)

    pendingHoldingsTransferGatekeeper.removeRequest(currency, depositRequest.id!)
    pendingCompletionGatekeeper.addNewDepositsForCurrency(currency, updatedDepositRequests)
  } catch (e) {
    await handlerDepositError(e, currency, depositRequest, pendingHoldingsTransferGatekeeper)
  }
}

function addToSuspendedAccountGatekeeper(currency, depositRequest, pendingHoldingsTransferGatekeeper, suspendedAccountDepositGatekeeper) {
  logger.warn(`Attempted to process request ${depositRequest.id} which the relevant account is suspended`)
  pendingHoldingsTransferGatekeeper.removeRequest(currency, depositRequest.id)
  suspendedAccountDepositGatekeeper.addNewDepositsForCurrency(currency, [depositRequest])
}
