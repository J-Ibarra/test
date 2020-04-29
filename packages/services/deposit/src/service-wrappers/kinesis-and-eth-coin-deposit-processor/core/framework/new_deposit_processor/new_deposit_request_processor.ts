import util from 'util'

import { isAccountSuspended } from '@abx-service-clients/account'
import { Logger } from '@abx-utils/logging'
import { CurrencyManager } from '@abx-utils/blockchain-currency-gateway'
import { CurrencyCode } from '@abx-types/reference-data'
import { DepositRequest } from '@abx-types/deposit'
import { DepositGatekeeper } from '../deposit_gatekeeper'
import { handlerDepositError } from './new_deposit_error_handler'
import { HoldingsTransactionDispatcher } from '../../../../../core'

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

  const depositTransactionConfirmed = await checkTransactionConfirmation(currency, depositRequest, onChainCurrencyManager)
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
    const updatedDepositRequests = await dispatcher.dispatchHoldingsTransactionForDepositRequests([depositRequest], currency)

    pendingHoldingsTransferGatekeeper.removeRequest(currency, depositRequest.id!)
    pendingCompletionGatekeeper.addNewDepositsForCurrency(currency, updatedDepositRequests)
  } catch (e) {
    await handlerDepositError(e, currency, depositRequest, pendingHoldingsTransferGatekeeper)
  }
}

async function checkTransactionConfirmation(currency: CurrencyCode, depositRequest: DepositRequest, onChainCurrencyManager: CurrencyManager) {
  const onChainGateway = onChainCurrencyManager.getCurrencyFromTicker(currency)

  try {
    const depositTransactionConfirmed = await onChainGateway.checkConfirmationOfTransaction(depositRequest.depositTxHash)

    return depositTransactionConfirmed
  } catch (e) {
    logger.error(`Error encountered while checking confirmation of deposit transaction ${depositRequest.depositTxHash}`)
    logger.error(JSON.stringify(util.inspect(e)))

    return false
  }
}

function addToSuspendedAccountGatekeeper(currency, depositRequest, pendingHoldingsTransferGatekeeper, suspendedAccountDepositGatekeeper) {
  logger.warn(`Attempted to process request ${depositRequest.id} which the relevant account is suspended`)
  pendingHoldingsTransferGatekeeper.removeRequest(currency, depositRequest.id)
  suspendedAccountDepositGatekeeper.addNewDepositsForCurrency(currency, [depositRequest])
}
