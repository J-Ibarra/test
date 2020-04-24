import util from 'util'

import { Logger } from '@abx-utils/logging'
import { CurrencyManager } from '@abx-utils/blockchain-currency-gateway'
import { sequelize, wrapInTransaction } from '@abx-utils/db-connection-utils'
import { CurrencyCode } from '@abx-types/reference-data'
import { DepositRequest } from '@abx-types/deposit'
import { completeReceivedDeposit } from '../../../../core'
import { DepositGatekeeper } from '../framework/deposit_gatekeeper'
import { isAccountSuspended } from '@abx-service-clients/account'
import { getBalanceAdjustmentForSourceEventId } from '@abx-service-clients/balance'

const logger = Logger.getInstance(
  'received_deposit_requests_processor', 
  'processReceivedDepositRequestForCurrency'
)

export async function processReceivedDepositRequestForCurrency(
  receivedGateKeeper: DepositGatekeeper,
  completedPendingHoldingsTransactionGatekeeper: DepositGatekeeper,
  pendingSuspendedDepositGatekeeper: DepositGatekeeper,
  currency: CurrencyCode,
  onChainCurrencyManager: CurrencyManager,
) {
  const depositRequest = receivedGateKeeper.getNewestDepositForCurrency(currency)

  if (!depositRequest) {
    return
  }

  const depositTransactionConfirmed = await checkTransactionConfirmation(currency, depositRequest, onChainCurrencyManager)
  if (!depositTransactionConfirmed) {
    logger.warn(`Attempted to process request ${depositRequest.id} where the transaction is not yet confirmed`)

    return receivedGateKeeper.unlockRequest(currency, depositRequest.id!)
  }
  logger.info(`Deposit transaction for request ${depositRequest.id} confirmed`)

  try {
    const accountIsSuspended = await isAccountSuspended(depositRequest.depositAddress.accountId)

    if (accountIsSuspended) {
      return addToSuspendedAccountGatekeeper(currency, depositRequest, receivedGateKeeper, pendingSuspendedDepositGatekeeper)
    }

    await completeDeposit(depositRequest)
    logger.info(`Deposit request ${depositRequest.id} successfully completed`)

    completedPendingHoldingsTransactionGatekeeper.addNewDepositsForCurrency(currency, [depositRequest])

  } catch (e) {
    logger.error(`Error encountered while process new deposit for ${currency}: ${depositRequest.id}`)
    logger.error(JSON.stringify(util.inspect(e)))
  } finally {
    receivedGateKeeper.removeRequest(currency, depositRequest.id!)
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

async function completeDeposit(depositRequest: DepositRequest) {
  return wrapInTransaction(sequelize, null, async transaction => {
    const existingBalanceAdjustment = await getBalanceAdjustmentForSourceEventId(depositRequest.id!)
    if (existingBalanceAdjustment === null) {
      // TODO: are there any more steps required?
      return
    }

    return completeReceivedDeposit(depositRequest, transaction)
  })
}

function addToSuspendedAccountGatekeeper(currency, depositRequest, receiverGateKeeper, suspendedAccountDepositGatekeeper) {
  logger.warn(`Attempted to process request ${depositRequest.id} which the relevant account is suspended`)
  receiverGateKeeper.removeRequest(currency, depositRequest.id)
  suspendedAccountDepositGatekeeper.addNewDepositsForCurrency(currency, [depositRequest])
}
